import mongoose from 'mongoose';

/**
 * §Gap G — precomputed analytics read-model. BI aggregations (GMV, margin,
 * redemption funnel, order status mix) are computed by a scheduled job and
 * stored here; the /platform/reports endpoints read THIS collection so heavy
 * aggregation never runs on the transactional request path.
 */
const reportSnapshotSchema = new mongoose.Schema(
  {
    scope: { type: String, required: true, default: 'platform' }, // 'platform' or a tenantId
    period: { type: String, required: true }, // YYYY-MM (UTC)
    metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
    computedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

reportSnapshotSchema.index({ scope: 1, period: 1 }, { unique: true });

export const ReportSnapshot = mongoose.model('ReportSnapshot', reportSnapshotSchema);
