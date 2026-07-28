import mongoose from 'mongoose';
import { tenantScopePlugin } from '../../plugins/tenantScope.plugin.js';
import { softDeletePlugin } from '../../plugins/softDelete.plugin.js';

const paymentSchema = new mongoose.Schema(
  {
    relatedType: { type: String, enum: ['wallet_funding', 'campaign_checkout'], required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    /** User who initiated the payment (wallet funding). */
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    provider: { type: String, enum: ['razorpay', 'manual_po'], default: 'razorpay' },
    /**
     * Legacy lookup key: Razorpay order id while pending, payment id after success.
     * Prefer razorpayOrderId / razorpayPaymentId for new code.
     */
    providerRefId: { type: String, default: '', index: true },
    razorpayOrderId: { type: String, default: '', index: true },
    razorpayPaymentId: { type: String, default: '', index: true },
    razorpaySignature: { type: String, default: '' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
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
paymentSchema.index({ tenantId: 1, razorpayOrderId: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);
