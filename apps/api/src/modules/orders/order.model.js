import mongoose from 'mongoose';
import { tenantScopePlugin } from '../../plugins/tenantScope.plugin.js';
import { softDeletePlugin } from '../../plugins/softDelete.plugin.js';

export const ORDER_STATUSES = [
  'created',
  'approved',
  'mockup_pending',
  'mockup_approved',
  'in_production',
  'qc_pending',
  'packed',
  'shipped',
  'delivered',
  'issue_raised',
  'replacement_processing',
];

const orderSchema = new mongoose.Schema(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipient', required: true, index: true },
    orderNumber: { type: String, required: true, unique: true },
    items: [
      {
        catalogProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'CatalogProduct' },
        name: String,
        variant: { size: String, color: String },
        qty: Number,
        unitPriceInr: Number,
      },
    ],
    shippingAddress: {
      name: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'IN' },
    },
    amountBreakdown: {
      subtotal: Number,
      serviceFee: Number,
      gst: Number,
      total: Number,
    },
    status: { type: String, enum: ORDER_STATUSES, default: 'created' },
    statusHistory: [{ status: String, at: Date, actorUserId: mongoose.Schema.Types.ObjectId, note: String }],
    trackingNumber: { type: String, default: '' },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
  },
  { timestamps: true },
);

orderSchema.plugin(tenantScopePlugin);
orderSchema.plugin(softDeletePlugin);
orderSchema.index({ tenantId: 1, status: 1 });

export const Order = mongoose.model('Order', orderSchema);
