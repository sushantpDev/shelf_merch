import crypto from 'node:crypto';
import { logger } from '../../../config/logger.js';
import { ApiError } from '../../../utils/errors.js';
import { RoleAssignment } from '../../roles/roleAssignment.model.js';
import { ZohoEmbedAuthCode, ZohoEmbedSession } from './zohoEmbedAuth.model.js';

export const EMBED_CODE_TTL_SEC = 60;
export const EMBED_SESSION_TTL_SEC = 8 * 60 * 60;

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

function randomToken() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Mint a one-time embed authorization code for a first-party authenticated user.
 * Returns the raw code once — only the hash is persisted.
 */
export async function issueEmbedAuthCode({ tenantId, userId, requestId }) {
  if (!requestId || typeof requestId !== 'string' || requestId.length < 8) {
    throw new ApiError(400, 'requestId is required', 'INVALID_REQUEST_ID');
  }

  const rawCode = randomToken();
  const codeHash = sha256(rawCode);
  const expiresAt = new Date(Date.now() + EMBED_CODE_TTL_SEC * 1000);

  await ZohoEmbedAuthCode.create({
    codeHash,
    tenantId,
    userId,
    requestId,
    expiresAt,
  });

  logger.info(
    {
      event: 'zoho_embed_issue',
      requestId,
      tenantId: String(tenantId),
      userId: String(userId),
      success: true,
    },
    'Zoho embed auth code issued',
  );

  return { code: rawCode, requestId, expiresInSec: EMBED_CODE_TTL_SEC };
}

/**
 * Exchange a one-time code for an opaque embedded session token.
 * Atomically consumes the code; rejects expired or reused codes.
 */
export async function exchangeEmbedAuthCode({ code, requestId }) {
  if (!code || typeof code !== 'string' || code.length < 16) {
    throw new ApiError(401, 'Invalid embed authorization code', 'ZOHO_EMBED_CODE_INVALID');
  }
  if (!requestId || typeof requestId !== 'string') {
    throw new ApiError(400, 'requestId is required', 'INVALID_REQUEST_ID');
  }

  const codeHash = sha256(code);
  const now = new Date();

  const record = await ZohoEmbedAuthCode.findOneAndUpdate(
    {
      codeHash,
      requestId,
      consumedAt: null,
      expiresAt: { $gt: now },
    },
    { $set: { consumedAt: now } },
    { returnDocument: 'before' },
  ).lean();

  if (!record) {
    logger.warn(
      { event: 'zoho_embed_exchange', requestId, success: false, reason: 'invalid_or_expired' },
      'Zoho embed auth exchange failed',
    );
    throw new ApiError(401, 'Invalid or expired embed authorization code', 'ZOHO_EMBED_CODE_INVALID');
  }

  const sessionToken = randomToken();
  const sessionHash = sha256(sessionToken);
  const expiresAt = new Date(Date.now() + EMBED_SESSION_TTL_SEC * 1000);

  await ZohoEmbedSession.create({
    sessionHash,
    tenantId: record.tenantId,
    userId: record.userId,
    expiresAt,
  });

  logger.info(
    {
      event: 'zoho_embed_exchange',
      requestId,
      tenantId: String(record.tenantId),
      userId: String(record.userId),
      success: true,
    },
    'Zoho embed session created',
  );

  return {
    sessionToken,
    tenantId: record.tenantId,
    userId: record.userId,
    expiresInSec: EMBED_SESSION_TTL_SEC,
  };
}

/**
 * Resolve an embedded-session cookie value to a ShelfMerch user snapshot.
 * Returns null when the session is missing, expired, or revoked.
 */
export async function resolveEmbedSession(sessionToken) {
  if (!sessionToken || typeof sessionToken !== 'string') return null;

  const sessionHash = sha256(sessionToken);
  const session = await ZohoEmbedSession.findOne({
    sessionHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).lean();

  if (!session) return null;

  const user = {
    userId: String(session.userId),
    tenantId: String(session.tenantId),
    role: '',
    scopeType: '',
    scopeId: null,
    assignedEntityIds: [],
  };

  const assignment = await RoleAssignment.findOne({
    userId: session.userId,
    tenantId: session.tenantId,
  }).lean();

  if (assignment) {
    user.role = assignment.role;
    user.scopeType = assignment.scopeType;
    user.scopeId = assignment.scopeId ? String(assignment.scopeId) : null;
    user.assignedEntityIds = (assignment.assignedEntityIds ?? []).map(String);
  }

  return user;
}

/** Revoke all embed sessions for a tenant/user (optional hardening on disconnect). */
export async function revokeEmbedSessionsForUser({ tenantId, userId }) {
  await ZohoEmbedSession.updateMany(
    { tenantId, userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}
