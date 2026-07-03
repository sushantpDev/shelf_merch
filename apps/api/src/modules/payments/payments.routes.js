import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenantContext, blockDuringImpersonation } from '../../middleware/tenant.middleware.js';
import { tenantArea } from '../../middleware/tenantAccess.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { idempotency } from '../../middleware/idempotency.middleware.js';
import * as controller from './payments.controller.js';
import { createRazorpayOrderSchema } from './payments.validation.js';

const router = Router();

router.use(authenticate, resolveTenant, requireTenantContext);

router.post(
  '/razorpay/order',
  tenantArea('wallets', 'write'),
  blockDuringImpersonation,
  idempotency(),
  validate({ body: createRazorpayOrderSchema }),
  asyncHandler(controller.createRazorpayOrder),
);

export default router;
