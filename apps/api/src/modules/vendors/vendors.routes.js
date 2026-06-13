import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant } from '../../middleware/tenant.middleware.js';
import { platformArea } from '../../middleware/platformAccess.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import * as controller from './vendors.controller.js';
import { createVendorSchema, updateVendorSchema, vendorIdParam } from './vendors.validation.js';

const router = Router();

router.use(authenticate, resolveTenant);

router.get('/', platformArea('production', 'read'), asyncHandler(controller.list));
router.post(
  '/',
  platformArea('production', 'write'),
  validate({ body: createVendorSchema }),
  asyncHandler(controller.create),
);
router.patch(
  '/:id',
  platformArea('production', 'write'),
  validate({ params: vendorIdParam, body: updateVendorSchema }),
  asyncHandler(controller.update),
);

export default router;
