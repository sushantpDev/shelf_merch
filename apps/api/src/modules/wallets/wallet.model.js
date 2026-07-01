import mongoose from 'mongoose';
import { tenantScopePlugin } from '../../plugins/tenantScope.plugin.js';
import { softDeletePlugin } from '../../plugins/softDelete.plugin.js';

export const WALLET_STATUSES = [
  'draft',
  'wallet_created',
  'entities_added',
  'budget_allocated',
  'managers_assigned',
  'review_pending',
  'active',
];

const walletSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
    totalAmount: { type: Number, default: 0 }, // total funded amount (sum of fund_in)
    allocatedAmount: { type: Number, default: 0 }, // cached: sum of entity allocations
    balance: { type: Number, default: 0 }, // cached: validated against the ledger
    status: { type: String, enum: WALLET_STATUSES, default: 'draft' },
    validFrom: { type: Date, default: null },
    validTo: { type: Date, default: null },
    fundingMethod: { type: String, enum: ['po_upload', 'online'], default: 'po_upload' },
    fundingDocument: {
      docType: { type: String, default: '' },
      docNumber: { type: String, default: '' },
      fileUrl: { type: String, default: '' },
      approvalStatus: { type: String, enum: ['', 'pending', 'approved', 'rejected'], default: '' },
      requestedAmount: { type: Number, default: 0 },
      plannedAllocations: [
        {
          entityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity' },
          amount: { type: Number, default: 0 },
        },
      ],
    },
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

walletSchema.plugin(tenantScopePlugin);
walletSchema.plugin(softDeletePlugin);
walletSchema.index({ tenantId: 1, status: 1 });

export const Wallet = mongoose.model('Wallet', walletSchema);
