import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenantContext } from '../../middleware/tenant.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import * as controller from './shops.controller.js';
import { createShopSchema, updateShopSchema, shopIdParams } from './shops.validation.js';

const router = Router();
router.use(authenticate, resolveTenant, requireTenantContext);

const adminOnly = requireRole('company_admin', 'platform_super_admin');
const canRead = requireRole('company_admin', 'entity_manager', 'platform_super_admin');

router.get('/', canRead, asyncHandler(controller.list));
router.post('/', adminOnly, validate({ body: createShopSchema }), asyncHandler(controller.create));
router.get('/:id', canRead, validate({ params: shopIdParams }), asyncHandler(controller.getOne));
router.patch('/:id', adminOnly, validate({ params: shopIdParams, body: updateShopSchema }), asyncHandler(controller.update));
router.post('/:id/publish', adminOnly, validate({ params: shopIdParams }), asyncHandler(controller.publish));
router.delete('/:id', adminOnly, validate({ params: shopIdParams }), asyncHandler(controller.archive));

export default router;
