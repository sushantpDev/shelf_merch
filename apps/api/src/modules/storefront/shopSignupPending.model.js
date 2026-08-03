import crypto from 'node:crypto';
import mongoose from 'mongoose';

/** Pending shop-customer signups awaiting email OTP (hashed OTP only). */
const shopSignupPendingSchema = new mongoose.Schema(
  {
    pendingId: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomUUID(),
      index: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    otpHash: { type: String, required: true, select: false },
    otpExpiresAt: { type: Date, required: true },
    resendAvailableAt: { type: Date, required: true },
    createdIp: { type: String, default: '' },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

shopSignupPendingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
shopSignupPendingSchema.index({ shopId: 1, email: 1 });

export const ShopSignupPending = mongoose.model('ShopSignupPending', shopSignupPendingSchema);
