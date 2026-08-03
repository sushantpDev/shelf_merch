import mongoose from 'mongoose';
import { softDeletePlugin } from '../../plugins/softDelete.plugin.js';

/**
 * Per-shop customer account. Identity is scoped to a single shop
 * (same email can have separate accounts on different shops).
 */
const shopCustomerSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    emailVerifiedAt: { type: Date, default: null },
    /** Set when account was created/claimed via a redeem invite token. */
    claimedViaRedeem: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

shopCustomerSchema.plugin(softDeletePlugin);
shopCustomerSchema.index({ shopId: 1, email: 1 }, { unique: true });
shopCustomerSchema.index({ tenantId: 1, email: 1 });

export const ShopCustomer = mongoose.model('ShopCustomer', shopCustomerSchema);
