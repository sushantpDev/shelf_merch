import mongoose from 'mongoose';
import { tenantScopePlugin } from '../../plugins/tenantScope.plugin.js';
import { softDeletePlugin } from '../../plugins/softDelete.plugin.js';

export const DEFAULT_MAPPING = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  department: 'department',
  employeeCode: 'employeeCode',
};

const importMappingSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: ['csv', 'bamboohr', 'keka', 'zoho_people'],
      default: 'csv',
    },
    mapping: {
      name: { type: String, default: DEFAULT_MAPPING.name },
      email: { type: String, default: DEFAULT_MAPPING.email },
      phone: { type: String, default: DEFAULT_MAPPING.phone },
      department: { type: String, default: DEFAULT_MAPPING.department },
      employeeCode: { type: String, default: DEFAULT_MAPPING.employeeCode },
    },
    lastImportAt: { type: Date, default: null },
  },
  { timestamps: true },
);

importMappingSchema.plugin(tenantScopePlugin);
importMappingSchema.plugin(softDeletePlugin);

export const ImportMapping = mongoose.model('ImportMapping', importMappingSchema);
