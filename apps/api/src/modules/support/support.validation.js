import { z } from 'zod';
import { objectId } from '../users/users.validation.js';
import {
  SUPPORT_TICKET_STATUSES,
  SUPPORT_TICKET_TYPES,
} from './supportTicket.model.js';

export const listSupportTicketsQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(SUPPORT_TICKET_STATUSES).optional(),
  type: z.enum(SUPPORT_TICKET_TYPES).optional(),
  tenantId: objectId.optional(),
  assignedToUserId: objectId.optional(),
});

export const supportTicketIdParam = z.object({ id: objectId });

export const createSupportTicketSchema = z.object({
  subject: z.string().min(1),
  description: z.string().optional().default(''),
  type: z.enum(SUPPORT_TICKET_TYPES).optional().default('other'),
  relatedOrderId: objectId.optional(),
  relatedRecipientId: objectId.optional(),
});

export const platformCreateTicketSchema = createSupportTicketSchema.extend({
  tenantId: objectId,
});

export const addMessageSchema = z.object({
  body: z.string().min(1),
  internal: z.boolean().optional().default(false),
});

/** Tenant help center: no tenantId/assignee filters — always scoped to the caller. */
export const tenantListTicketsQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(SUPPORT_TICKET_STATUSES).optional(),
});

/** Tenant replies can never be internal notes. */
export const tenantAddMessageSchema = z.object({
  body: z.string().min(1),
});

/** Employee (recipient) tickets: no related-record ids accepted from the client. */
export const recipientCreateTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().max(5000).optional().default(''),
  type: z.enum(SUPPORT_TICKET_TYPES).optional().default('other'),
});

export const updateSupportTicketStatusSchema = z.object({
  status: z.enum(SUPPORT_TICKET_STATUSES),
});

export const assignTicketSchema = z.object({
  userId: objectId,
});

export const linkOrderSchema = z.object({
  orderId: objectId,
});

export const searchQuerySchema = z.object({
  q: z.string().min(2),
});

export const updateAddressSchema = z.object({
  address: z
    .object({
      name: z.string(),
      phone: z.string(),
      line1: z.string(),
      line2: z.string(),
      city: z.string(),
      state: z.string(),
      pincode: z.string(),
      country: z.string(),
    })
    .partial(),
});
