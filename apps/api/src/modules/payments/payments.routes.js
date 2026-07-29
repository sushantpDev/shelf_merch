import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenantContext, blockDuringImpersonation } from '../../middleware/tenant.middleware.js';
import { rolesForTenantArea, tenantArea } from '../../middleware/tenantAccess.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { idempotency } from '../../middleware/idempotency.middleware.js';
import { ForbiddenError } from '../../utils/errors.js';
import * as controller from './payments.controller.js';
import { createRazorpayOrderSchema, verifyRazorpayPaymentSchema } from './payments.validation.js';

const router = Router();

router.use(authenticate, resolveTenant, requireTenantContext);

/** Wallet top-ups need wallets:write; campaign UPI/card checkout needs campaignOps:write. */
function razorpayOrderAccess(req, _res, next) {
  const purpose = req.body?.purpose === 'campaign_spend' ? 'campaign_spend' : 'wallet_funding';
  const area = purpose === 'campaign_spend' ? 'campaignOps' : 'wallets';
  return tenantArea(area, 'write')(req, _res, next);
}

/** Verify is shared by wallet funding and campaign checkout. */
function razorpayVerifyAccess(req, _res, next) {
  const allowed = new Set([
    ...rolesForTenantArea('wallets', 'write'),
    ...rolesForTenantArea('campaignOps', 'write'),
  ]);
  if (!allowed.has(req.user?.role)) {
    return next(
      new ForbiddenError(`Payment verify requires one of roles: ${[...allowed].join(', ')}`),
    );
  }
  next();
}

router.post(
  '/razorpay/order',
  validate({ body: createRazorpayOrderSchema }),
  razorpayOrderAccess,
  blockDuringImpersonation,
  idempotency(),
  asyncHandler(controller.createRazorpayOrder),
);

router.post(
  '/razorpay/verify',
  validate({ body: verifyRazorpayPaymentSchema }),
  razorpayVerifyAccess,
  blockDuringImpersonation,
  idempotency(),
  asyncHandler(controller.verifyRazorpayPayment),
);

export default router;
