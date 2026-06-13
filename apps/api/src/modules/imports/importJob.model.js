import mongoose from 'mongoose';
import { tenantScopePlugin } from '../../plugins/tenantScope.plugin.js';
import { softDeletePlugin } from '../../plugins/softDelete.plugin.js';

// Job status lives in Mongo so the frontend can poll without touching Redis.
const importJobSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['contacts'], default: 'contacts' },
    fileName: { type: String, default: '' },
    status: { type: String, enum: ['queued', 'processing', 'done', 'failed'], default: 'queued' },
    totalRows: { type: Number, default: 0 },
    validCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    errors: [{ row: Number, message: String }],
    // CSV payload kept inline (capped by the 5MB upload limit) so a separate
    // worker process can pick the job up without shared file storage.
    csv: { type: Buffer, select: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

importJobSchema.plugin(tenantScopePlugin);
importJobSchema.plugin(softDeletePlugin);

export const ImportJob = mongoose.model('ImportJob', importJobSchema);
