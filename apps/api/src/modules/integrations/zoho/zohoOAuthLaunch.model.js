import mongoose from 'mongoose';

/** One-time OAuth launch codes for the Zoho People embed popup (hashed at rest). */
const zohoOAuthLaunchCodeSchema = new mongoose.Schema(
  {
    codeHash: { type: String, required: true, unique: true, index: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requestId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

zohoOAuthLaunchCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Short-lived OAuth launch sessions — cookie holds raw token; only hash stored.
 * Consumed when GET /connect starts the Zoho authorization redirect.
 */
const zohoOAuthLaunchSessionSchema = new mongoose.Schema(
  {
    sessionHash: { type: String, required: true, unique: true, index: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requestId: { type: String, default: '' },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

zohoOAuthLaunchSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ZohoOAuthLaunchCode = mongoose.model('ZohoOAuthLaunchCode', zohoOAuthLaunchCodeSchema);
export const ZohoOAuthLaunchSession = mongoose.model(
  'ZohoOAuthLaunchSession',
  zohoOAuthLaunchSessionSchema,
);
