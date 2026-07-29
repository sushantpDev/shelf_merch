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
const canWrite = tenantArea('orders', 'write');

const orderIdParams = z.object({ orderId: objectId });

router.get(
  '/by-order/:orderId',
  canRead,
  validate({ params: orderIdParams }),
  asyncHandler(async (req, res) => {
    res.json(
      await service.getOrderInvoiceByOrderId({
        tenantId: req.tenantId,
        orderId: req.params.orderId,
      }),
    );
  }),
);

/** Generate (or return existing) invoice PDF for an order — fixes pre-existing orders. */
router.post(
  '/by-order/:orderId/generate',
  canWrite,
  validate({ params: orderIdParams }),
  asyncHandler(async (req, res) => {
    const invoice = await service.ensureOrderInvoice({
      tenantId: req.tenantId,
      orderId: req.params.orderId,
    });
    res.status(201).json(invoice);
  }),
);

export default router;
