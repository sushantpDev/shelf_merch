import mongoose from 'mongoose';
import { tenantScopePlugin } from '../../plugins/tenantScope.plugin.js';
import { softDeletePlugin } from '../../plugins/softDelete.plugin.js';

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    /** Public vanity URL — globally unique (e.g. salesforce → salesforce.store). */
    slug: { type: String, trim: true, lowercase: true },
    currencyMode: { type: String, enum: ['points', 'inr'], default: 'points' },
    pointsConversionEnabled: { type: Boolean, default: false },
    logoUrl: { type: String, default: '' },
    bannerConfig: { type: Object, default: () => ({}) },
    categories: { type: [String], default: [] },
    /** @deprecated Derived from activeListingKeys — kept for backward compatibility. */
    selectedCatalogProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CatalogProduct' }],
    /** @deprecated Use featuredListingKeys — kept for backward compatibility. */
    featuredCatalogProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CatalogProduct' }],
    /** Active branded listings on this shop (`collectionId:catalogProductId`). */
    activeListingKeys: [{ type: String }],
    /** Homepage featured picks (listing keys, subset of activeListingKeys). */
    featuredListingKeys: [{ type: String }],
    status: { type: String, enum: ['draft', 'live'], default: 'draft' },
  },
  { timestamps: true },
);

shopSchema.plugin(tenantScopePlugin);
shopSchema.plugin(softDeletePlugin);
shopSchema.index({ tenantId: 1, status: 1 });
shopSchema.index({ slug: 1 }, {
  unique: true,
  partialFilterExpression: { slug: { $type: 'string', $gt: '' } },
});

export const Shop = mongoose.model('Shop', shopSchema);
