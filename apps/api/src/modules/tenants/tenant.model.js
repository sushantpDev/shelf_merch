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

export const TENANT_STATUSES = ['trial', 'active', 'suspended', 'archived'];
export const TENANT_PLANS = ['trial', 'starter', 'growth', 'enterprise'];

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logoUrl: { type: String, default: '' },
    currency: { type: String, default: 'INR' },
    gstin: { type: String, default: '' },
    billingAddress: { type: addressSchema, default: () => ({}) },
    // archived = logins refused (SUPER_ADMIN_FLOW §3.4).
    status: { type: String, enum: TENANT_STATUSES, default: 'trial' },
    plan: { type: String, enum: TENANT_PLANS, default: 'trial' },
    limits: {
      maxCampaigns: { type: Number, default: 5 },
      maxRecipientsPerCampaign: { type: Number, default: 500 },
      maxWallets: { type: Number, default: 3 },
      maxUsers: { type: Number, default: 10 },
    },
  },
  { timestamps: true },
);

tenantSchema.plugin(softDeletePlugin);

export const Tenant = mongoose.model('Tenant', tenantSchema);
