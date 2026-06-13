import { z } from 'zod';
import { objectId } from '../users/users.validation.js';
import { SHIPMENT_STATUSES } from './shipment.model.js';

export const listShipmentsQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(SHIPMENT_STATUSES).optional(),
  tenantId: objectId.optional(),
  orderId: objectId.optional(),
  courier: z.string().optional(),
  awb: z.string().optional(),
});

export const shipmentIdParam = z.object({ id: objectId });

export const createShipmentSchema = z.object({
  orderId: objectId,
  courier: z.string().min(1),
  awb: z.string().min(1),
  trackingUrl: z.string().optional().default(''),
  eta: z.coerce.date().optional().nullable(),
});

export const bulkAwbSchema = z
  .object({
    rows: z
      .array(
        z.object({
          orderNumber: z.string().min(1),
          courier: z.string().min(1),
          awb: z.string().min(1),
        }),
      )
      .optional(),
    csv: z.string().optional(),
  })
  .refine((body) => (body.rows?.length ?? 0) > 0 || Boolean(body.csv), {
    message: 'Provide "rows" (JSON) or "csv" (orderNumber,courier,awb)',
  });

export const addShipmentEventSchema = z.object({
  status: z.enum(SHIPMENT_STATUSES),
  location: z.string().optional().default(''),
  note: z.string().optional().default(''),
  at: z.coerce.date().optional(),
});

export const updateShipmentSchema = z
  .object({
    courier: z.string().min(1),
    awb: z.string().min(1),
    trackingUrl: z.string(),
    eta: z.coerce.date().nullable(),
  })
  .partial();
