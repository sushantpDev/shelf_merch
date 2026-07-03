import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenantContext } from '../../middleware/tenant.middleware.js';
import { tenantArea } from '../../middleware/tenantAccess.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import * as controller from './shops.controller.js';
import { createShopSchema, updateShopSchema, shopIdParams } from './shops.validation.js';

const router = Router();
router.use(authenticate, resolveTenant, requireTenantContext);

const canWrite = tenantArea('shops', 'write');
const canRead = tenantArea('shops', 'read');

router.get('/', canRead, asyncHandler(controller.list));
router.post('/', canWrite, validate({ body: createShopSchema }), asyncHandler(controller.create));
router.get('/:id', canRead, validate({ params: shopIdParams }), asyncHandler(controller.getOne));
router.patch('/:id', canWrite, validate({ params: shopIdParams, body: updateShopSchema }), asyncHandler(controller.update));
router.post('/:id/publish', canWrite, validate({ params: shopIdParams }), asyncHandler(controller.publish));
router.delete('/:id', canWrite, validate({ params: shopIdParams }), asyncHandler(controller.archive));

export default router;
