import { z } from 'zod';
import { objectId } from '../users/users.validation.js';

const address = z
  .object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().optional(),
  })
  .partial();

export const createTenantSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, digits, hyphens'),
  adminName: z.string().min(1),
  adminEmail: z.string().email(),
  gstin: z.string().optional().default(''),
  currency: z.string().optional().default('INR'),
});

export const updateTenantSchema = z
  .object({
    name: z.string().min(1),
    logoUrl: z.string(),
    gstin: z.string(),
    billingAddress: address,
  })
  .partial();

export const tenantStatusSchema = z
  .object({
    status: z.enum(['active', 'suspended', 'trial', 'archived']),
    reason: z.string().optional(),
  })
  .refine((body) => !['suspended', 'archived'].includes(body.status) || Boolean(body.reason), {
    message: 'Suspending or archiving a tenant requires a reason (audited)',
    path: ['reason'],
  });

export const tenantPlanSchema = z.object({
  plan: z.enum(['trial', 'starter', 'growth', 'enterprise']),
});

export const tenantLimitsSchema = z.object({
  limits: z
    .object({
      maxCampaigns: z.number().int().positive(),
      maxRecipientsPerCampaign: z.number().int().positive(),
      maxWallets: z.number().int().positive(),
      maxUsers: z.number().int().positive(),
      requestsPerMinute: z.number().int().positive(),
    })
    .partial(),
});

export const impersonateSchema = z.object({
  reason: z.string().min(1),
  reasonCategory: z.string().min(1),
});

export const transferOwnershipSchema = z.object({
  newOwnerUserId: objectId,
});
