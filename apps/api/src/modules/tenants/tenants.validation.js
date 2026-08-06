import { z } from 'zod';
import { objectId } from '../users/users.validation.js';
import { PHASE1_TENANT_STATUSES, TENANT_PLANS } from './tenant.model.js';

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

const slugSchema = z
  .string()
  .min(2)
  .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, digits, hyphens');

export const createTenantSchema = z.object({
  name: z.string().min(1),
  slug: slugSchema,
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

/** Platform settings update — includes slug/currency with uniqueness enforced in service. */
export const platformUpdateTenantSchema = z
  .object({
    name: z.string().min(1),
    slug: slugSchema,
    logoUrl: z.string(),
    currency: z.string().min(1),
    gstin: z.string(),
    billingAddress: address,
    confirmSlugChange: z.boolean().optional(),
  })
  .partial()
  .refine((body) => Object.keys(body).some((k) => k !== 'confirmSlugChange'), {
    message: 'At least one field is required',
  });

export const listTenantsQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  /** active | suspended | archived | all — omit for default (active+suspended) */
  status: z.enum(['active', 'suspended', 'archived', 'all', 'trial']).optional(),
  search: z.string().optional(),
  sort: z.enum(['name', 'createdAt', 'lastActiveAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

const reasonRequired = z.string().min(1, 'A reason is required');

/** Phase 1 status change — target must be an operational status (not trial). */
export const tenantStatusSchema = z
  .object({
    status: z.enum(PHASE1_TENANT_STATUSES),
    reason: z.string().optional(),
  })
  .superRefine((body, ctx) => {
    if (['suspended', 'archived'].includes(body.status) && !body.reason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Suspending or archiving a tenant requires a reason (audited)',
        path: ['reason'],
      });
    }
  });

export const setPrimaryAdminSchema = z.object({
  userId: objectId,
  reason: z.string().optional(),
});

/** @deprecated Phase 1 has no subscription plans — kept for backward-compatible API. */
export const tenantPlanSchema = z.object({
  plan: z.enum(TENANT_PLANS),
});

/** @deprecated Phase 1 does not expose business quotas in the UI. */
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

export { reasonRequired };
