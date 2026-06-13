import mongoose from 'mongoose';
import { tenantScopePlugin } from '../../plugins/tenantScope.plugin.js';
import { softDeletePlugin } from '../../plugins/softDelete.plugin.js';

const productRefSchema = new mongoose.Schema(
  {
    catalogProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'CatalogProduct' },
    brand: String,
    name: String,
    group: String,
  },
  { _id: false },
);

const collectionSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    code: { type: String, required: true }, // e.g. "C343955972"
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: ['draft', 'ready', 'archived'], default: 'draft' },
    artworkUrl: { type: String, default: '' },
    productRefs: { type: [productRefSchema], default: [] },
    preferredColors: { type: [String], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

collectionSchema.plugin(tenantScopePlugin);
collectionSchema.plugin(softDeletePlugin);
collectionSchema.index({ tenantId: 1, shopId: 1 });

export const Collection = mongoose.model('Collection', collectionSchema);
export { productRefSchema };
