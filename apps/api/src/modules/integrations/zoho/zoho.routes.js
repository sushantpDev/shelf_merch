import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { env } from '../../../config/env.js';
import { accessVerifyOptions } from '../../../config/jwt.js';
import { setRequestContext } from '../../../config/requestContext.js';
import { RoleAssignment } from '../../roles/roleAssignment.model.js';
import { UnauthorizedError } from '../../../utils/errors.js';
import { resolveTenant, requireTenantContext, blockDuringImpersonation } from '../../../middleware/tenant.middleware.js';
import { tenantArea } from '../../../middleware/tenantAccess.middleware.js';
import { rateLimit } from '../../../middleware/rateLimit.middleware.js';
import * as controller from './zoho.controller.js';

const router = Router();

function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

const zohoOAuthRateLimit = rateLimit([
  { prefix: 'zoho:oauth:ip', limit: 30, windowSec: 15 * 60, key: clientIp, critical: true },
]);

const zohoSyncRateLimit = rateLimit([
  {
    prefix: 'zoho:sync:tenant',
    limit: 5,
    windowSec: 60 * 60,
    key: (req) => req.tenantId || clientIp(req),
    critical: true,
  },
  { prefix: 'zoho:sync:ip', limit: 20, windowSec: 60 * 60, key: clientIp, critical: true },
]);

const zohoDisconnectRateLimit = rateLimit([
  {
    prefix: 'zoho:disconnect:tenant',
    limit: 20,
    windowSec: 60 * 60,
    key: (req) => req.tenantId || clientIp(req),
    critical: true,
  },
]);

/**
 * Like authenticate, but also accepts the short-lived Zoho bridge cookie so a
 * full-page redirect to GET /connect works without putting JWTs in the URL.
 */
async function authenticateZoho(req, _res, next) {
  const token = controller.extractZohoAccessToken(req);
  if (!token) return next(new UnauthorizedError('Missing access token'));

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, accessVerifyOptions());
    const user = {
      userId: payload.sub,
      tenantId: payload.tenantId ?? null,
      role: payload.role,
      scopeType: payload.scopeType,
      scopeId: payload.scopeId ?? null,
      assignedEntityIds: payload.assignedEntityIds ?? [],
    };

    if (user.tenantId) {
      const assignment = await RoleAssignment.findOne({
        userId: user.userId,
        tenantId: user.tenantId,
      }).lean();
      if (assignment) {
        user.role = assignment.role;
        user.scopeType = assignment.scopeType;
        user.scopeId = assignment.scopeId ? String(assignment.scopeId) : null;
        user.assignedEntityIds = (assignment.assignedEntityIds ?? []).map(String);
      }
    }

    req.user = user;
    req.impersonation = payload.impersonation ?? { isImpersonating: false, originalUserId: null };
    setRequestContext({ userId: user.userId });
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired access token'));
  }
}

const adminWrite = [
  authenticateZoho,
  resolveTenant,
  requireTenantContext,
  blockDuringImpersonation,
  tenantArea('integrations', 'write'),
];

const adminRead = [
  authenticateZoho,
  resolveTenant,
  requireTenantContext,
  tenantArea('integrations', 'read'),
];

router.get('/status', ...adminRead, asyncHandler(controller.getStatus));
router.post('/bridge', ...adminWrite, zohoOAuthRateLimit, asyncHandler(controller.bridge));
router.get('/connect', ...adminWrite, zohoOAuthRateLimit, asyncHandler(controller.connect));
/** Public OAuth callback — state cookie + server-side state record bind the session. */
router.get('/callback', zohoOAuthRateLimit, asyncHandler(controller.callback));
router.post(
  '/sync-employees',
  ...adminWrite,
  zohoSyncRateLimit,
  asyncHandler(controller.syncEmployees),
);
router.delete(
  '/disconnect',
  ...adminWrite,
  zohoDisconnectRateLimit,
  asyncHandler(controller.disconnect),
);

export default router;
