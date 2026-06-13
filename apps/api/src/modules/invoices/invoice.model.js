import mongoose from 'mongoose';
import { tenantScopePlugin } from '../../plugins/tenantScope.plugin.js';
import { softDeletePlugin } from '../../plugins/softDelete.plugin.js';

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    // §3.8 — proforma (pre-pay) vs tax (post-pay, GST/HSN/GSTIN).
    type: { type: String, enum: ['proforma', 'tax'], default: 'tax' },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    relatedOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    lineItems: [
      {
        description: String,
        hsnCode: String,
        quantity: Number,
        unitPrice: Number,
        gstRate: Number,
        amount: Number,
      },
    ],
    totalAmount: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    senderGstin: { type: String, default: '' },
    receiverGstin: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'issued', 'paid', 'void'], default: 'issued' },
    dueAt: { type: Date, default: null },
    pdfUrl: { type: String, default: '' },
  },
  { timestamps: true },
);

invoiceSchema.plugin(tenantScopePlugin);
invoiceSchema.plugin(softDeletePlugin);

export const Invoice = mongoose.model('Invoice', invoiceSchema);
