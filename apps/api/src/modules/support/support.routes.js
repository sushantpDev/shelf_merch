import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenantContext } from '../../middleware/tenant.middleware.js';
import { platformArea, rolesForArea } from '../../middleware/platformAccess.middleware.js';
import { uploader, DOCUMENT_TYPES } from '../../middleware/upload.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { ForbiddenError, NotFoundError } from '../../utils/errors.js';
import { SupportTicket } from './supportTicket.model.js';
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

function isSupportWriter(role) {
  return rolesForArea('support', 'write').includes(role);
}

/**
 * Admit help-desk writers, or the ticket's current assignee (department handoff).
 * Sets req.isSupportWriter for the controller/service.
 */
async function supportWriteOrAssignee(req, _res, next) {
  if (isSupportWriter(req.user?.role)) {
    req.isSupportWriter = true;
    return next();
  }
  if (!rolesForArea('support', 'read').includes(req.user?.role)) {
    return next(
      new ForbiddenError(
        `This support write requires one of roles: ${rolesForArea('support', 'write').join(', ')}`,
      ),
    );
  }
  const ticket = await SupportTicket.findOne({ _id: req.params.id })
    .setOptions({ skipTenantGuard: true })
    .select('assignedToUserId')
    .lean();
  if (!ticket) return next(new NotFoundError('Support ticket not found'));
  if (String(ticket.assignedToUserId ?? '') !== String(req.user.userId)) {
    return next(
      new ForbiddenError('Only support staff or the ticket assignee can update this ticket'),
    );
  }
  req.isSupportWriter = false;
  return next();
}

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
// Optional evidence attachment (screenshot/PDF, ≤10MB). Multer runs first so
// multipart form fields land in req.body before zod validation; plain JSON
// posts pass through multer untouched.
const attachmentUpload = uploader({ allow: DOCUMENT_TYPES, maxSizeMb: 10 });
tenantSupportRouter.post(
  '/',
  attachmentUpload.single('attachment'),
  validate({ body: createSupportTicketSchema }),
  asyncHandler(controller.create),
);
tenantSupportRouter.post(
  '/:id/messages',
  validate({ params: supportTicketIdParam, body: tenantAddMessageSchema }),
  asyncHandler(controller.addMyMessage),
);
tenantSupportRouter.post(
  '/:id/confirm',
  validate({ params: supportTicketIdParam }),
  asyncHandler(controller.confirmMine),
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
  asyncHandler(supportWriteOrAssignee),
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
