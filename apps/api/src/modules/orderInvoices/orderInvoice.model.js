import mongoose from 'mongoose';
import { tenantScopePlugin } from '../../plugins/tenantScope.plugin.js';
import { softDeletePlugin } from '../../plugins/softDelete.plugin.js';

const orderInvoiceSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true, index: true },
    invoiceNumber: { type: String, required: true },
    pdfUrl: { type: String, required: true },
    generatedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['generated', 'failed'], default: 'generated' },
  },
  { timestamps: true, collection: 'orderinvoices' },
);

orderInvoiceSchema.plugin(tenantScopePlugin);
orderInvoiceSchema.plugin(softDeletePlugin);

export const OrderInvoice = mongoose.model('OrderInvoice', orderInvoiceSchema);
