import mongoose from 'mongoose';
import { softDeletePlugin } from '../../plugins/softDelete.plugin.js';

export const VENDOR_TYPES = ['printing', 'packaging', 'logistics'];
export const VENDOR_STATUSES = ['active', 'inactive'];

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: VENDOR_TYPES, required: true },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    capabilities: [{ type: String }],
    status: { type: String, enum: VENDOR_STATUSES, default: 'active' },
  },
  { timestamps: true },
);

vendorSchema.plugin(softDeletePlugin);
vendorSchema.index({ status: 1, type: 1 });

export const Vendor = mongoose.model('Vendor', vendorSchema);
