import mongoose from 'mongoose';
import { tenantScopePlugin } from '../../plugins/tenantScope.plugin.js';
import { softDeletePlugin } from '../../plugins/softDelete.plugin.js';

const paymentSchema = new mongoose.Schema(
  {
    relatedType: { type: String, enum: ['wallet_funding', 'campaign_checkout'], required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    provider: { type: String, enum: ['razorpay', 'manual_po'], default: 'razorpay' },
    providerRefId: { type: String, default: '', index: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
    },
    rawWebhookPayload: { type: Object, default: null },
  },
  { timestamps: true },
);

paymentSchema.plugin(tenantScopePlugin);
paymentSchema.plugin(softDeletePlugin);
paymentSchema.index({ tenantId: 1, providerRefId: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);
