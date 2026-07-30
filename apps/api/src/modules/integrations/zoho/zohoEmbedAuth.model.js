import mongoose from 'mongoose';

/**
 * One-time embed authorization codes (hashed at rest).
 * TTL index garbage-collects expired rows.
 */
const zohoEmbedAuthCodeSchema = new mongoose.Schema(
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

zohoEmbedAuthCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Opaque embedded-session records for the Zoho People iframe.
 * Cookie holds the raw session token; only the hash is stored.
 */
const zohoEmbedSessionSchema = new mongoose.Schema(
  {
    sessionHash: { type: String, required: true, unique: true, index: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

zohoEmbedSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ZohoEmbedAuthCode = mongoose.model('ZohoEmbedAuthCode', zohoEmbedAuthCodeSchema);
export const ZohoEmbedSession = mongoose.model('ZohoEmbedSession', zohoEmbedSessionSchema);
