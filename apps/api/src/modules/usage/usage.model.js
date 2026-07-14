import mongoose from 'mongoose';

/**
 * §Gap E — per-tenant usage meter. One monthly counter per (tenant, metric):
 * billing + fair-use signal. Business events are $inc-upserted here; the
 * high-frequency raw request count lives in Redis (usage.service) to avoid a
 * Mongo write per request.
 */
const usageCounterSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    metric: { type: String, required: true },
    period: { type: String, required: true }, // YYYY-MM (UTC)
    value: { type: Number, default: 0 },
  },
  { timestamps: true },
);

usageCounterSchema.index({ tenantId: 1, metric: 1, period: 1 }, { unique: true });

export const UsageCounter = mongoose.model('UsageCounter', usageCounterSchema);
