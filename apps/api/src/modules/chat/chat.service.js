import { ChatNode } from './chatNode.model.js';
import { ChatSession } from './chatSession.model.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.js';

const WELCOME_NODE_ID = 'welcome';
const HUMAN_HANDOFF_NODE_ID = 'human_handoff';

function botHistoryEntries(node) {
  return node.messages.map((text) => ({
    sender: 'bot',
    text,
    nodeId: node.nodeId,
    timestamp: new Date(),
  }));
}

export async function getNodeById(nodeId) {
  const node = await ChatNode.findOne({ nodeId }).lean();
  if (!node) throw new NotFoundError(`Chat node "${nodeId}" not found`);
  return node;
}

async function assertSessionAccess(session, userId) {
  if (session.userId && userId && String(session.userId) !== String(userId)) {
    throw new ForbiddenError('This chat session belongs to another user');
  }
}

export async function getSessionBySessionId(sessionId) {
  const session = await ChatSession.findOne({ sessionId });
  if (!session) throw new NotFoundError('Chat session not found');
  return session;
}

export async function startSession({ sessionId, userId = null }) {
  const existing = await ChatSession.findOne({ sessionId });
  if (existing) {
    if (userId && !existing.userId) {
      existing.userId = userId;
      await existing.save();
    }
    await assertSessionAccess(existing, userId);
    try {
      const node = await getNodeById(existing.currentNodeId);
      return { session: existing.toObject(), node, isNew: false };
    } catch (err) {
      if (!(err instanceof NotFoundError)) throw err;
      const welcomeNode = await getNodeById(WELCOME_NODE_ID);
      existing.currentNodeId = WELCOME_NODE_ID;
      existing.history = botHistoryEntries(welcomeNode);
      existing.status = 'active';
      await existing.save();
      return { session: existing.toObject(), node: welcomeNode, isNew: false };
    }
  }

  const welcomeNode = await getNodeById(WELCOME_NODE_ID);
  const session = await ChatSession.create({
    sessionId,
    userId: userId || null,
    currentNodeId: WELCOME_NODE_ID,
    history: botHistoryEntries(welcomeNode),
    status: 'active',
  });

  return { session: session.toObject(), node: welcomeNode, isNew: true };
}

export async function advanceSession({ sessionId, selectedOption, userId = null }) {
  const session = await getSessionBySessionId(sessionId);
  await assertSessionAccess(session, userId);

  session.history.push({
    sender: 'user',
    text: selectedOption.label,
    nodeId: session.currentNodeId,
    timestamp: new Date(),
  });

  const nextNode = await getNodeById(selectedOption.next);
  session.currentNodeId = nextNode.nodeId;
  session.history.push(...botHistoryEntries(nextNode));
  if (session.status === 'handed_off' && nextNode.nodeId !== HUMAN_HANDOFF_NODE_ID) {
    session.status = 'active';
  }
  await session.save();

  return { session: session.toObject(), node: nextNode };
}

export async function updateSessionStatus({ sessionId, status, userId = null }) {
  const session = await getSessionBySessionId(sessionId);
  await assertSessionAccess(session, userId);
  session.status = status;
  await session.save();
  return session.toObject();
}

export async function restartSession({ sessionId, userId = null }) {
  const session = await getSessionBySessionId(sessionId);
  await assertSessionAccess(session, userId);

  const welcomeNode = await getNodeById(WELCOME_NODE_ID);
  session.currentNodeId = WELCOME_NODE_ID;
  session.history = botHistoryEntries(welcomeNode);
  session.status = 'active';
  await session.save();

  return { session: session.toObject(), node: welcomeNode };
}

export async function handoffToHuman({ sessionId, userId = null }) {
  const session = await getSessionBySessionId(sessionId);
  await assertSessionAccess(session, userId);

  session.history.push({
    sender: 'user',
    text: 'Talk to our team',
    nodeId: session.currentNodeId,
    timestamp: new Date(),
  });

  const handoffNode = await getNodeById(HUMAN_HANDOFF_NODE_ID);
  session.currentNodeId = HUMAN_HANDOFF_NODE_ID;
  session.history.push(...botHistoryEntries(handoffNode));
  session.status = 'handed_off';
  await session.save();

  return { session: session.toObject(), node: handoffNode };
}
