import crypto from 'node:crypto';
import mongoose from 'mongoose';

/**
 * Temporary signup payloads awaiting email OTP verification.
 * Users are NOT created until OTP succeeds. TTL cleans expired rows.
 */
const signupPendingSchema = new mongoose.Schema(
  {
    pendingId: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomUUID(),
      index: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    otpHash: { type: String, required: true, select: false },
    otpExpiresAt: { type: Date, required: true, index: true },
    resendAvailableAt: { type: Date, required: true },
    createdIp: { type: String, default: '' },
    /** Absolute expiry for the whole pending signup (OTP window + buffer). */
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

signupPendingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SignupPending = mongoose.model('SignupPending', signupPendingSchema);
