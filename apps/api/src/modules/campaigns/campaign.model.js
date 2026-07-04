import mongoose from 'mongoose';
import { tenantScopePlugin } from '../../plugins/tenantScope.plugin.js';
import { softDeletePlugin } from '../../plugins/softDelete.plugin.js';

export const CAMPAIGN_STATUSES = [
  'draft',
  'recipients_uploaded',
  'credits_allocated',
  'approved',
  'launched',
  'redemption_open',
  'redemption_closed',
  'fulfilled',
];

const campaignSchema = new mongoose.Schema(
  {
    entityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['points', 'items', 'kit'], required: true },
    fulfillmentMode: { type: String, enum: ['redeem', 'surprise', 'single'], default: 'redeem' },
    singleLocation: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      line1: { type: String, default: '' },
      line2: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      country: { type: String, default: 'IN' },
    },
    catalogMode: { type: String, enum: ['full_store', 'selected_products'], default: 'full_store' },
    selectedProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CatalogProduct' }],
    kitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Kit', default: null },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null },
    pointsScope: { type: String, enum: ['stadium', 'shop'], default: 'shop' },
    creditsPerRecipient: { type: Number, default: 0 }, // INR
    recipientCount: { type: Number, default: 0 }, // cached
    totalBudget: { type: Number, default: 0 }, // creditsPerRecipient * recipientCount
    message: {
      from: { type: String, default: '' },
      body: { type: String, default: '' },
    },
    schedule: {
      mode: { type: String, enum: ['now', 'scheduled', 'self'], default: 'now' },
      sendAt: { type: Date, default: null },
      timezone: { type: String, default: 'Asia/Kolkata' },
    },
    status: { type: String, enum: CAMPAIGN_STATUSES, default: 'draft' },
    draftState: {
      step: { type: Number, default: 0 },
      selectedWalletId: { type: String, default: '' },
      selRecips: [{ type: String }],
      recips: { type: Number, default: 0 },
      pay: { type: String, enum: ['wallet', 'card'], default: 'wallet' },
      preview: { type: String, enum: ['landing', 'email'], default: 'landing' },
      when: { type: String, enum: ['now', 'scheduled', 'self'], default: 'now' },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

campaignSchema.plugin(tenantScopePlugin);
campaignSchema.plugin(softDeletePlugin);
campaignSchema.index({ tenantId: 1, status: 1 });
campaignSchema.index({ tenantId: 1, entityId: 1 });

export const Campaign = mongoose.model('Campaign', campaignSchema);
