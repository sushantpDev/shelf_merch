import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant } from '../../middleware/tenant.middleware.js';
import { platformArea } from '../../middleware/platformAccess.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import * as controller from './shipments.controller.js';
import {
  listShipmentsQuery,
  shipmentIdParam,
  createShipmentSchema,
  bulkAwbSchema,
  addShipmentEventSchema,
  updateShipmentSchema,
} from './shipments.validation.js';

const router = Router();

router.use(authenticate, resolveTenant);

const shipmentsRead = platformArea('shipments', 'read');
const shipmentsWrite = platformArea('shipments', 'write');

router.get('/', shipmentsRead, validate({ query: listShipmentsQuery }), asyncHandler(controller.list));
router.post('/', shipmentsWrite, validate({ body: createShipmentSchema }), asyncHandler(controller.create));
router.post('/bulk-awb', shipmentsWrite, validate({ body: bulkAwbSchema }), asyncHandler(controller.bulkAwb));
// TODO: Shiprocket/Delhivery webhook integration (post-MVP) — manual events for now.
router.post(
  '/:id/events',
  shipmentsWrite,
  validate({ params: shipmentIdParam, body: addShipmentEventSchema }),
  asyncHandler(controller.addEvent),
);
router.patch(
  '/:id',
  shipmentsWrite,
  validate({ params: shipmentIdParam, body: updateShipmentSchema }),
  asyncHandler(controller.update),
);
router.post(
  '/:id/resend-tracking',
  shipmentsWrite,
  validate({ params: shipmentIdParam }),
  asyncHandler(controller.resendTracking),
);

export default router;
