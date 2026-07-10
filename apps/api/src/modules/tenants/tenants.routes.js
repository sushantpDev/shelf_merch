import { Router } from 'express';
import { uploader, IMAGE_TYPES } from '../../middleware/upload.middleware.js';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenantContext, blockDuringImpersonation } from '../../middleware/tenant.middleware.js';
import { tenantArea } from '../../middleware/tenantAccess.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { objectId } from '../users/users.validation.js';
import { platformArea } from '../../middleware/platformAccess.middleware.js';
import * as controller from './tenants.controller.js';
import {
  createTenantSchema,
  updateTenantSchema,
  tenantStatusSchema,
  tenantPlanSchema,
  tenantLimitsSchema,
  impersonateSchema,
  transferOwnershipSchema,
} from './tenants.validation.js';

// Tenant-facing routes: /api/v1/tenants
export const tenantsRouter = Router();
tenantsRouter.use(authenticate, resolveTenant);
const upload = uploader({ allow: IMAGE_TYPES, maxSizeMb: 5 });

tenantsRouter.post(
  '/',
  requireRole('platform_super_admin'),
  validate({ body: createTenantSchema }),
  asyncHandler(controller.create),
);
tenantsRouter.get('/me', requireTenantContext, asyncHandler(controller.me));
tenantsRouter.patch(
  '/me',
  requireTenantContext,
  tenantArea('settings', 'write'),
  validate({ body: updateTenantSchema }),
  asyncHandler(controller.updateMe),
);
tenantsRouter.post(
  '/me/logo',
  requireTenantContext,
  tenantArea('settings', 'write'),
  upload.single('logo'),
  asyncHandler(controller.uploadLogo),
);
tenantsRouter.post(
  '/me/transfer-ownership',
  requireTenantContext,
  tenantArea('settings', 'write'),
  blockDuringImpersonation,
  validate({ body: transferOwnershipSchema }),
  asyncHandler(controller.transferOwnership),
);

// Platform control plane: /api/v1/platform/tenants
export const platformTenantsRouter = Router();
platformTenantsRouter.use(authenticate, resolveTenant);

const tenantsRead = platformArea('tenants', 'read');
const tenantsWrite = platformArea('tenants', 'write'); // super admin only

platformTenantsRouter.get('/', tenantsRead, asyncHandler(controller.list));
platformTenantsRouter.post(
  '/',
  tenantsWrite,
  validate({ body: createTenantSchema }),
  asyncHandler(controller.create),
);
platformTenantsRouter.get(
  '/:id',
  tenantsRead,
  validate({ params: z.object({ id: objectId }) }),
  asyncHandler(controller.getOne),
);
platformTenantsRouter.get(
  '/:id/overview',
  tenantsRead,
  validate({ params: z.object({ id: objectId }) }),
  asyncHandler(controller.overview),
);
platformTenantsRouter.patch(
  '/:id/status',
  tenantsWrite,
  validate({ params: z.object({ id: objectId }), body: tenantStatusSchema }),
  asyncHandler(controller.setStatus),
);
platformTenantsRouter.patch(
  '/:id/plan',
  tenantsWrite,
  validate({ params: z.object({ id: objectId }), body: tenantPlanSchema }),
  asyncHandler(controller.setPlan),
);
platformTenantsRouter.patch(
  '/:id/limits',
  tenantsWrite,
  validate({ params: z.object({ id: objectId }), body: tenantLimitsSchema }),
  asyncHandler(controller.setLimits),
);
platformTenantsRouter.post(
  '/:id/reset-admin-access',
  tenantsWrite,
  validate({ params: z.object({ id: objectId }) }),
  asyncHandler(controller.resetAdminAccess),
);
platformTenantsRouter.post(
  '/:tenantId/impersonate',
  requireRole('platform_super_admin'),
  validate({ params: z.object({ tenantId: objectId }), body: impersonateSchema }),
  asyncHandler(controller.impersonate),
);
