import mongoose from 'mongoose';
import { tenantScopePlugin } from '../../plugins/tenantScope.plugin.js';
import { softDeletePlugin } from '../../plugins/softDelete.plugin.js';
import { productRefSchema } from '../collections/collection.model.js';

/**
 * Published customised kits archive.
 * Dual-written alongside the operational `kits` collection so send/list flows
 * stay unchanged while kitPrice + branding metadata are persisted here.
 */
const customisedKitSchema = new mongoose.Schema(
  {
    /** Reference to the operational Kit document. */
    kitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Kit', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    productRefs: { type: [productRefSchema], default: [] },
    artworkUrl: { type: String, default: '' },
    designNotes: { type: String, default: '' },
    packaging: { type: String, enum: ['none', 'box'], default: 'box' },
    kitPrice: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'live', 'archived'], default: 'live' },
  },
  { timestamps: true, collection: 'customised_kits' },
);

customisedKitSchema.plugin(tenantScopePlugin);
customisedKitSchema.plugin(softDeletePlugin);
customisedKitSchema.index({ tenantId: 1, kitId: 1 }, { unique: true });

export const CustomisedKit = mongoose.model('CustomisedKit', customisedKitSchema);
