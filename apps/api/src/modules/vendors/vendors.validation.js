import { z } from 'zod';
import { objectId } from '../users/users.validation.js';
import { VENDOR_TYPES, VENDOR_STATUSES } from './vendor.model.js';

export const createVendorSchema = z.object({
  name: z.string().min(1),
  type: z.enum(VENDOR_TYPES),
  contactEmail: z.string().default(''),
  contactPhone: z.string().optional().default(''),
  capabilities: z.array(z.string()).optional().default([]),
  status: z.enum(VENDOR_STATUSES).optional().default('active'),
});

export const updateVendorSchema = createVendorSchema.partial();

export const vendorIdParam = z.object({ id: objectId });
