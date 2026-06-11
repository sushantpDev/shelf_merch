import { z } from 'zod';
import { objectId } from '../users/users.validation.js';
import { ORDER_STATUSES } from './order.model.js';

export const orderIdParams = z.object({ id: objectId });

export const listOrdersQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(ORDER_STATUSES).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().optional().default(''),
  trackingNumber: z.string().optional().default(''),
});
