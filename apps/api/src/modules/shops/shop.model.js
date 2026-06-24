import mongoose from 'mongoose';
import { tenantScopePlugin } from '../../plugins/tenantScope.plugin.js';
import { softDeletePlugin } from '../../plugins/softDelete.plugin.js';

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    currencyMode: { type: String, enum: ['points', 'inr', 'priceless'], default: 'points' },
    logoUrl: { type: String, default: '' },
    bannerConfig: { type: Object, default: () => ({}) },
    categories: { type: [String], default: [] },
    /** Catalog products enabled for this shop's public storefront. Empty = no products visible. */
    selectedCatalogProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CatalogProduct' }],
    status: { type: String, enum: ['draft', 'live'], default: 'draft' },
  },
  { timestamps: true },
);

shopSchema.plugin(tenantScopePlugin);
shopSchema.plugin(softDeletePlugin);
shopSchema.index({ tenantId: 1, status: 1 });

export const Shop = mongoose.model('Shop', shopSchema);
