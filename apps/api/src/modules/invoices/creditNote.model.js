import mongoose from 'mongoose';
import { tenantScopePlugin } from '../../plugins/tenantScope.plugin.js';
import { softDeletePlugin } from '../../plugins/softDelete.plugin.js';

// §3.8 — credit note against a tax invoice, always with a reason.
const creditNoteSchema = new mongoose.Schema(
  {
    creditNoteNumber: { type: String, required: true, unique: true },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    amount: { type: Number, required: true },
    gstAmount: { type: Number, default: 0 },
    reason: { type: String, required: true },
    issuedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

creditNoteSchema.plugin(tenantScopePlugin);
creditNoteSchema.plugin(softDeletePlugin);

export const CreditNote = mongoose.model('CreditNote', creditNoteSchema);
