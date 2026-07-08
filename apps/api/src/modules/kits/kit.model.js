import mongoose from 'mongoose';
import { tenantScopePlugin } from '../../plugins/tenantScope.plugin.js';
import { softDeletePlugin } from '../../plugins/softDelete.plugin.js';
import { productRefSchema } from '../collections/collection.model.js';

const kitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    productRefs: { type: [productRefSchema], default: [] },
    artworkUrl: { type: String, default: '' },
    designNotes: { type: String, default: '' },
    packaging: { type: String, enum: ['none', 'box'], default: 'none' },
    status: { type: String, enum: ['draft', 'live', 'archived'], default: 'draft' },
    lastSentAt: { type: Date, default: null },
  },
  { timestamps: true },
);

kitSchema.plugin(tenantScopePlugin);
kitSchema.plugin(softDeletePlugin);

export const Kit = mongoose.model('Kit', kitSchema);
