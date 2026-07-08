import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenantContext } from '../../middleware/tenant.middleware.js';
import { tenantArea } from '../../middleware/tenantAccess.middleware.js';
import { requireScope } from '../../middleware/abac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import * as controller from './entities.controller.js';
import {
  createEntitySchema,
  updateEntitySchema,
  assignManagerSchema,
  entityIdParams,
  listEntitiesQuery,
  entityTransactionsQuery,
} from './entities.validation.js';

const router = Router();

router.use(authenticate, resolveTenant, requireTenantContext);

const canWrite = tenantArea('wallets', 'write');
const canRead = tenantArea('wallets', 'read');
const entityScope = requireScope((req) => req.params.id); // ABAC on /:id routes

router.get('/', canRead, validate({ query: listEntitiesQuery }), asyncHandler(controller.list));
router.post('/', canWrite, validate({ body: createEntitySchema }), asyncHandler(controller.create));
router.get('/:id', canRead, entityScope, validate({ params: entityIdParams }), asyncHandler(controller.getOne));
router.get(
  '/:id/transactions',
  canRead,
  entityScope,
  validate({ params: entityIdParams, query: entityTransactionsQuery }),
  asyncHandler(controller.transactions),
);
router.patch(
  '/:id',
  canWrite,
  validate({ params: entityIdParams, body: updateEntitySchema }),
  asyncHandler(controller.update),
);
router.delete('/:id', canWrite, validate({ params: entityIdParams }), asyncHandler(controller.remove));
router.post(
  '/:id/assign-manager',
  canWrite,
  validate({ params: entityIdParams, body: assignManagerSchema }),
  asyncHandler(controller.assignManager),
);

export default router;
