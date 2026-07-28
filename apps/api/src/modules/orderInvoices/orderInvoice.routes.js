import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenantContext } from '../../middleware/tenant.middleware.js';
import { tenantArea } from '../../middleware/tenantAccess.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { z } from 'zod';
import { objectId } from '../users/users.validation.js';
import * as service from './orderInvoice.service.js';

const router = Router();

router.use(authenticate, resolveTenant, requireTenantContext);

const canRead = tenantArea('orders', 'read');

const orderIdParams = z.object({ orderId: objectId });

router.get(
  '/by-order/:orderId',
  canRead,
  validate({ params: orderIdParams }),
  asyncHandler(async (req, res) => {
    res.json(await service.getOrderInvoiceByOrderId({ tenantId: req.tenantId, orderId: req.params.orderId }));
  }),
);

export default router;
