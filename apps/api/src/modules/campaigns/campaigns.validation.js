import { z } from 'zod';
import { objectId } from '../users/users.validation.js';

export const createCampaignSchema = z.object({
  entityId: objectId,
  name: z.string().min(1),
  type: z.enum(['points', 'items', 'kit']),
  fulfillmentMode: z.enum(['redeem', 'surprise', 'single']).optional().default('redeem'),
  singleLocation: z
    .object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional().default(''),
      line1: z.string().min(1),
      line2: z.string().optional().default(''),
      city: z.string().min(1),
      state: z.string().min(1),
      pincode: z.string().min(1),
      country: z.string().optional().default('IN'),
    })
    .optional(),
  catalogMode: z.enum(['full_store', 'selected_products']).optional().default('full_store'),
  selectedProductIds: z.array(objectId).optional().default([]),
  kitId: objectId.nullable().optional().default(null),
  shopId: objectId.nullable().optional().default(null),
  message: z
    .object({
      from: z.string().optional(),
      body: z.string().optional(),
    })
    .optional(),
  schedule: z
    .object({
      mode: z.enum(['now', 'scheduled', 'self']).optional(),
      sendAt: z.coerce.date().nullable().optional(),
      timezone: z.string().optional(),
    })
    .optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial().omit({ entityId: true });

export const importRecipientsSchema = z.object({
  recipients: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional().default(''),
        contactId: objectId.optional(),
        creditAmount: z.number().positive().optional(),
      }),
    )
    .min(1),
});

export const allocateCreditsSchema = z.object({
  creditsPerRecipient: z.number().positive(),
});

export const campaignIdParams = z.object({ id: objectId });
