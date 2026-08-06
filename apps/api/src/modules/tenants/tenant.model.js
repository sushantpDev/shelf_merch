import mongoose from 'mongoose';
import { softDeletePlugin } from '../../plugins/softDelete.plugin.js';

const addressSchema = new mongoose.Schema(
  {
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'IN' },
  },
  { _id: false },
);

/** Phase 1 operational statuses. `trial` is legacy (kept for existing records). */
export const PHASE1_TENANT_STATUSES = ['active', 'suspended', 'archived'];
export const TENANT_STATUSES = ['trial', 'active', 'suspended', 'archived'];

/** @deprecated Phase 1 has no subscription plans — kept for backward compatibility. */
export const TENANT_PLANS = ['trial', 'starter', 'growth', 'enterprise'];

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logoUrl: { type: String, default: '' },
    currency: { type: String, default: 'INR' },
    gstin: { type: String, default: '' },
    billingAddress: { type: addressSchema, default: () => ({}) },
    // Phase 1: active | suspended | archived. `trial` is legacy only.
    status: { type: String, enum: TENANT_STATUSES, default: 'active' },
    /** Primary tenant administrator (tenant member). Distinct from platform admins. */
    primaryAdminUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    /** @deprecated Phase 1 has no subscription plans — do not use in Phase 1 flows. */
    plan: { type: String, enum: TENANT_PLANS, default: 'trial' },
    /**
     * @deprecated Phase 1 does not enforce business quotas.
     * `requestsPerMinute` remains a technical noisy-neighbor control (platform guardrails).
     */
    limits: {
      maxCampaigns: { type: Number, default: 5 },
      maxRecipientsPerCampaign: { type: Number, default: 500 },
      maxWallets: { type: Number, default: 3 },
      maxUsers: { type: Number, default: 10 },
      requestsPerMinute: { type: Number, default: 600 },
    },
  },
  { timestamps: true },
);

tenantSchema.plugin(softDeletePlugin);

export const Tenant = mongoose.model('Tenant', tenantSchema);
