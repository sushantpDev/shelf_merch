import * as chatService from './chat.service.js';

export async function getNode(req, res) {
  res.json(await chatService.getNodeById(req.params.nodeId));
}

export async function startSession(req, res) {
  const userId = req.user?.userId ?? req.body.userId ?? null;
  const result = await chatService.startSession({
    sessionId: req.body.sessionId,
    userId,
  });
  res.status(result.isNew ? 201 : 200).json(result);
}

export async function advanceSession(req, res) {
  const result = await chatService.advanceSession({
    sessionId: req.params.sessionId,
    selectedOption: req.body.selectedOption,
    userId: req.user?.userId ?? null,
  });
  res.json(result);
}

export async function updateSessionStatus(req, res) {
  const session = await chatService.updateSessionStatus({
    sessionId: req.params.sessionId,
    status: req.body.status,
    userId: req.user?.userId ?? null,
  });
  res.json(session);
}

export async function restartSession(req, res) {
  const result = await chatService.restartSession({
    sessionId: req.params.sessionId,
    userId: req.user?.userId ?? null,
  });
  res.json(result);
}

export async function handoffSession(req, res) {
  const result = await chatService.handoffToHuman({
    sessionId: req.params.sessionId,
    userId: req.user?.userId ?? null,
  });
  res.json(result);
}
