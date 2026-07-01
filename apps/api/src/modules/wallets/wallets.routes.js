import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenantContext, blockDuringImpersonation } from '../../middleware/tenant.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { idempotency } from '../../middleware/idempotency.middleware.js';
import * as controller from './wallets.controller.js';
import {
  createWalletSchema,
  updateWalletSchema,
  fundWalletSchema,
  allocateSchema,
  transferSchema,
  transactionsQuerySchema,
  walletIdParams,
} from './wallets.validation.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.use(authenticate, resolveTenant, requireTenantContext);

const adminOnly = requireRole('company_admin', 'platform_super_admin');
const canRead = requireRole('company_admin', 'entity_manager', 'platform_super_admin', 'platform_finance_admin');

router.get('/', canRead, asyncHandler(controller.list));
router.post('/', adminOnly, validate({ body: createWalletSchema }), asyncHandler(controller.create));
router.get('/:id', canRead, validate({ params: walletIdParams }), asyncHandler(controller.getOne));
router.patch('/:id', adminOnly, validate({ params: walletIdParams, body: updateWalletSchema }), asyncHandler(controller.update));
router.post(
  '/:id/funding-document',
  adminOnly,
  validate({ params: walletIdParams }),
  upload.single('document'),
  asyncHandler(controller.uploadFundingDocument),
);

// §6.4 — wallet adjustments are blocked during impersonation.
router.post(
  '/:id/fund',
  adminOnly,
  blockDuringImpersonation,
  idempotency(),
  validate({ params: walletIdParams, body: fundWalletSchema }),
  asyncHandler(controller.fund),
);
router.post(
  '/:id/allocate',
  adminOnly,
  blockDuringImpersonation,
  idempotency(),
  validate({ params: walletIdParams, body: allocateSchema }),
  asyncHandler(controller.allocate),
);
router.post(
  '/:id/transfer',
  adminOnly,
  blockDuringImpersonation,
  idempotency(),
  validate({ params: walletIdParams, body: transferSchema }),
  asyncHandler(controller.transfer),
);
router.get(
  '/:id/transactions',
  canRead,
  validate({ params: walletIdParams, query: transactionsQuerySchema }),
  asyncHandler(controller.transactions),
);
router.post(
  '/:id/activate',
  adminOnly,
  blockDuringImpersonation,
  validate({ params: walletIdParams }),
  asyncHandler(controller.activate),
);

export default router;
