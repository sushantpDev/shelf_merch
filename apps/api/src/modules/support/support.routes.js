import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenantContext } from '../../middleware/tenant.middleware.js';
import { platformArea } from '../../middleware/platformAccess.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import * as controller from './support.controller.js';
import {
  listSupportTicketsQuery,
  supportTicketIdParam,
  createSupportTicketSchema,
  platformCreateTicketSchema,
  addMessageSchema,
  updateSupportTicketStatusSchema,
  assignTicketSchema,
  linkOrderSchema,
  searchQuerySchema,
  updateAddressSchema,
  tenantListTicketsQuery,
  tenantAddMessageSchema,
} from './support.validation.js';

export const tenantSupportRouter = Router();
tenantSupportRouter.use(authenticate, resolveTenant, requireTenantContext);
tenantSupportRouter.get(
  '/',
  validate({ query: tenantListTicketsQuery }),
  asyncHandler(controller.listMine),
);
tenantSupportRouter.get(
  '/:id',
  validate({ params: supportTicketIdParam }),
  asyncHandler(controller.getMine),
);
tenantSupportRouter.post(
  '/',
  validate({ body: createSupportTicketSchema }),
  asyncHandler(controller.create),
);
tenantSupportRouter.post(
  '/:id/messages',
  validate({ params: supportTicketIdParam, body: tenantAddMessageSchema }),
  asyncHandler(controller.addMyMessage),
);

// §3.9 — the help desk is cross-tenant.
export const platformSupportRouter = Router();
platformSupportRouter.use(authenticate, resolveTenant);

const supportRead = platformArea('support', 'read');
const supportWrite = platformArea('support', 'write');

platformSupportRouter.get(
  '/',
  supportRead,
  validate({ query: listSupportTicketsQuery }),
  asyncHandler(controller.listPlatform),
);
platformSupportRouter.get(
  '/search',
  supportRead,
  validate({ query: searchQuerySchema }),
  asyncHandler(controller.search),
);
platformSupportRouter.get(
  '/:id',
  supportRead,
  validate({ params: supportTicketIdParam }),
  asyncHandler(controller.getOne),
);
platformSupportRouter.post(
  '/',
  supportWrite,
  validate({ body: platformCreateTicketSchema }),
  asyncHandler(controller.createPlatform),
);
platformSupportRouter.post(
  '/:id/messages',
  supportWrite,
  validate({ params: supportTicketIdParam, body: addMessageSchema }),
  asyncHandler(controller.addMessage),
);
platformSupportRouter.patch(
  '/:id/status',
  supportWrite,
  validate({ params: supportTicketIdParam, body: updateSupportTicketStatusSchema }),
  asyncHandler(controller.updateStatus),
);
platformSupportRouter.patch(
  '/:id/assign',
  supportWrite,
  validate({ params: supportTicketIdParam, body: assignTicketSchema }),
  asyncHandler(controller.assign),
);
platformSupportRouter.post(
  '/:id/link-order',
  supportWrite,
  validate({ params: supportTicketIdParam, body: linkOrderSchema }),
  asyncHandler(controller.linkOrder),
);
platformSupportRouter.post(
  '/:id/resend-redemption-link',
  supportWrite,
  validate({ params: supportTicketIdParam }),
  asyncHandler(controller.resendRedemptionLink),
);
platformSupportRouter.post(
  '/:id/resend-tracking-link',
  supportWrite,
  validate({ params: supportTicketIdParam }),
  asyncHandler(controller.resendTrackingLink),
);
platformSupportRouter.patch(
  '/:id/recipient-address',
  supportWrite,
  validate({ params: supportTicketIdParam, body: updateAddressSchema }),
  asyncHandler(controller.updateAddress),
);
