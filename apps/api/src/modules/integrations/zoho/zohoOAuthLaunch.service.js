import crypto from 'node:crypto';
import { logger } from '../../../config/logger.js';
import { ApiError } from '../../../utils/errors.js';
import { RoleAssignment } from '../../roles/roleAssignment.model.js';
import { ZohoOAuthLaunchCode, ZohoOAuthLaunchSession, ZohoOAuthLaunchCompletion } from './zohoOAuthLaunch.model.js';

export const OAUTH_LAUNCH_CODE_TTL_SEC = 60;
export const OAUTH_LAUNCH_SESSION_TTL_SEC = 5 * 60;
export const OAUTH_LAUNCH_COMPLETION_TTL_SEC = 5 * 60;

export const OAUTH_LAUNCH_SAFE_ERROR_CODES = Object.freeze({
  OAUTH_DENIED: 'OAUTH_DENIED',
  OAUTH_STATE_INVALID: 'OAUTH_STATE_INVALID',
  OAUTH_CODE_MISSING: 'OAUTH_CODE_MISSING',
  OAUTH_CONNECTION_FAILED: 'OAUTH_CONNECTION_FAILED',
});

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

function randomToken() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Mint a one-time OAuth launch code for an embedded-session user.
 * Returns the raw code once — only the hash is persisted.
 */
export async function issueOAuthLaunchCode({ tenantId, userId, requestId }) {
  if (!requestId || typeof requestId !== 'string' || requestId.length < 8) {
    throw new ApiError(400, 'requestId is required', 'INVALID_REQUEST_ID');
  }

  const rawCode = randomToken();
  const codeHash = sha256(rawCode);
  const expiresAt = new Date(Date.now() + OAUTH_LAUNCH_CODE_TTL_SEC * 1000);

  await ZohoOAuthLaunchCode.create({
    codeHash,
    tenantId,
    userId,
    requestId,
    expiresAt,
  });

  await ZohoOAuthLaunchCompletion.findOneAndUpdate(
    { requestId, tenantId },
    {
      $set: {
        userId,
        status: 'pending',
        errorCode: null,
        completedAt: null,
        expiresAt: new Date(Date.now() + OAUTH_LAUNCH_COMPLETION_TTL_SEC * 1000),
      },
    },
    { upsert: true },
  );

  logger.info(
    {
      event: 'zoho_oauth_launch_issue',
      requestId,
      tenantId: String(tenantId),
      userId: String(userId),
      success: true,
    },
    'Zoho OAuth launch code issued',
  );

  return { code: rawCode, requestId, expiresInSec: OAUTH_LAUNCH_CODE_TTL_SEC };
}

/**
 * Exchange a one-time launch code for an opaque OAuth launch session token.
 */
export async function exchangeOAuthLaunchCode({ code, requestId }) {
  if (!code || typeof code !== 'string' || code.length < 16) {
    throw new ApiError(401, 'Invalid OAuth launch code', 'ZOHO_OAUTH_LAUNCH_CODE_INVALID');
  }
  if (!requestId || typeof requestId !== 'string') {
    throw new ApiError(400, 'requestId is required', 'INVALID_REQUEST_ID');
  }

  const codeHash = sha256(code);
  const now = new Date();

  const record = await ZohoOAuthLaunchCode.findOneAndUpdate(
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
      {
        event: 'zoho_oauth_launch_exchange',
        requestId,
        success: false,
        reason: 'invalid_or_expired',
      },
      'Zoho OAuth launch exchange failed',
    );
    throw new ApiError(401, 'Invalid or expired OAuth launch code', 'ZOHO_OAUTH_LAUNCH_CODE_INVALID');
  }

  const sessionToken = randomToken();
  const sessionHash = sha256(sessionToken);
  const expiresAt = new Date(Date.now() + OAUTH_LAUNCH_SESSION_TTL_SEC * 1000);

  await ZohoOAuthLaunchSession.create({
    sessionHash,
    tenantId: record.tenantId,
    userId: record.userId,
    requestId,
    expiresAt,
  });

  logger.info(
    {
      event: 'zoho_oauth_launch_exchange',
      requestId,
      tenantId: String(record.tenantId),
      userId: String(record.userId),
      success: true,
    },
    'Zoho OAuth launch session created',
  );

  return {
    sessionToken,
    tenantId: record.tenantId,
    userId: record.userId,
    requestId,
    expiresInSec: OAUTH_LAUNCH_SESSION_TTL_SEC,
  };
}

async function buildUserSnapshot(session) {
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

/** Resolve launch session cookie — valid only until consumed or expired. */
export async function resolveOAuthLaunchSession(sessionToken) {
  if (!sessionToken || typeof sessionToken !== 'string') return null;

  const sessionHash = sha256(sessionToken);
  const session = await ZohoOAuthLaunchSession.findOne({
    sessionHash,
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).lean();

  if (!session) return null;
  return buildUserSnapshot(session);
}

/** Atomically consume the launch session when starting OAuth connect. */
export async function consumeOAuthLaunchSession(sessionToken) {
  if (!sessionToken || typeof sessionToken !== 'string') {
    throw new ApiError(401, 'Invalid OAuth launch session', 'ZOHO_OAUTH_LAUNCH_SESSION_INVALID');
  }

  const sessionHash = sha256(sessionToken);
  const now = new Date();
  const session = await ZohoOAuthLaunchSession.findOneAndUpdate(
    {
      sessionHash,
      consumedAt: null,
      expiresAt: { $gt: now },
    },
    { $set: { consumedAt: now } },
    { returnDocument: 'before' },
  ).lean();

  if (!session) {
    throw new ApiError(401, 'Invalid or expired OAuth launch session', 'ZOHO_OAUTH_LAUNCH_SESSION_INVALID');
  }

  return buildUserSnapshot(session);
}

/** Mark embed OAuth launch as completed after successful Zoho callback. */
export async function markOAuthLaunchCompleted({ requestId, tenantId, userId }) {
  if (!requestId) return;
  const now = new Date();
  await ZohoOAuthLaunchCompletion.findOneAndUpdate(
    { requestId, tenantId, userId },
    { $set: { status: 'completed', completedAt: now, errorCode: null } },
  );
  logger.info(
    {
      event: 'zoho_oauth_launch_completed',
      requestId,
      tenantId: String(tenantId),
      userId: String(userId),
      success: true,
    },
    'Zoho OAuth launch marked completed',
  );
}

/** Mark embed OAuth launch as failed with a safe internal error code. */
export async function markOAuthLaunchFailed({ requestId, tenantId, userId, errorCode }) {
  if (!requestId) return;
  const safeCode = Object.values(OAUTH_LAUNCH_SAFE_ERROR_CODES).includes(errorCode)
    ? errorCode
    : OAUTH_LAUNCH_SAFE_ERROR_CODES.OAUTH_CONNECTION_FAILED;
  const now = new Date();
  await ZohoOAuthLaunchCompletion.findOneAndUpdate(
    { requestId, tenantId, userId },
    { $set: { status: 'failed', completedAt: now, errorCode: safeCode } },
  );
  logger.warn(
    {
      event: 'zoho_oauth_launch_failed',
      requestId,
      tenantId: String(tenantId),
      userId: String(userId),
      errorCode: safeCode,
    },
    'Zoho OAuth launch marked failed',
  );
}

/**
 * Poll completion status for an embed OAuth launch (tenant-scoped).
 * Returns null when no record exists for this tenant.
 */
export async function getOAuthLaunchCompletionStatus({ requestId, tenantId }) {
  if (!requestId || typeof requestId !== 'string') {
    throw new ApiError(400, 'requestId is required', 'INVALID_REQUEST_ID');
  }

  const record = await ZohoOAuthLaunchCompletion.findOne({ requestId, tenantId }).lean();
  if (!record) {
    throw new ApiError(404, 'OAuth launch not found', 'OAUTH_LAUNCH_NOT_FOUND');
  }

  return {
    status: record.status,
    errorCode: record.errorCode ?? null,
  };
}
