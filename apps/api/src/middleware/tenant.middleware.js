import { ApiError, ForbiddenError } from '../utils/errors.js';
import { PLATFORM_ROLES } from '../modules/roles/roleAssignment.model.js';
import { applyTenantGuardrails } from '../services/tenantGuardrails.service.js';
import { setRequestContext } from '../config/requestContext.js';

/**
 * Sets req.tenantId for every downstream query (§6.3), then applies §Gap E
 * per-tenant guardrails (noisy-neighbor request ceiling + metering). This is
 * the single seam every tenant-scoped request passes through, so wiring the
 * guardrails here gives universal coverage with no per-route changes.
 * - Tenant users: always their own tenantId — header overrides are ignored.
 * - Platform users: tenantId comes from an impersonation token (preferred,
 *   §6.4) — the impersonated tenantId is baked into the JWT itself.
 */
export async function resolveTenant(req, res, next) {
  try {
    const isPlatform = PLATFORM_ROLES.includes(req.user.role);

    if (!isPlatform) {
      if (!req.user.tenantId) {
        return next(new ForbiddenError('User has no tenant'));
      }
      req.tenantId = req.user.tenantId;
    } else {
      // Platform user: tenant context only exists while impersonating.
      req.tenantId = req.user.tenantId ?? null;
    }

    if (req.tenantId) {
      setRequestContext({ tenantId: req.tenantId });
      const quota = await applyTenantGuardrails(req.tenantId);
      if (!quota.allowed) {
        res.set('Retry-After', String(quota.retryAfterSec));
        return next(
          new ApiError(429, 'Tenant request quota exceeded — slow down', 'TENANT_QUOTA_EXCEEDED', {
            retryAfterSec: quota.retryAfterSec,
          }),
        );
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}

/** For tenant-scoped routes that platform users may not hit without impersonating. */
export function requireTenantContext(req, _res, next) {
  if (!req.tenantId) {
    return next(new ForbiddenError('This route requires a tenant context'));
  }
  next();
}

/** §6.4 — sensitive actions are disabled while impersonating. */
export function blockDuringImpersonation(req, _res, next) {
  if (req.impersonation?.isImpersonating) {
    return next(new ForbiddenError('Disabled during impersonation'));
  }
  next();
}
