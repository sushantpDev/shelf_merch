import mongoose from 'mongoose';

const GUARDED_OPS = [
  'find',
  'findOne',
  'findOneAndUpdate',
  'findOneAndDelete',
  'findOneAndReplace',
  'updateOne',
  'updateMany',
  'deleteOne',
  'deleteMany',
  'countDocuments',
];

/**
 * §3.1 Tenant Isolation — every tenant-scoped model gets a required, indexed
 * tenantId and a query guard that throws if a query is issued without a
 * tenantId filter. Platform/super-admin code paths must explicitly opt out
 * with `.setOptions({ skipTenantGuard: true })`.
 *
 * Mongoose 9: pre middleware no longer receives `next()` — throw instead of
 * `next(err)`.
 */
export function tenantScopePlugin(schema) {
  schema.add({
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
  });

  const guard = function () {
    if (this.getOptions().skipTenantGuard) return;
    const filter = this.getFilter();
    if (filter.tenantId === undefined && filter._id === undefined) {
      throw new Error(
        `Tenant-scoped query on "${this.model.modelName}" is missing a tenantId filter. ` +
          'Pass tenantId, or setOptions({ skipTenantGuard: true }) on platform routes.',
      );
    }
    // Queries by _id alone are still a leak vector (§3.1: never findById on
    // tenant data) — require tenantId even when _id is present.
    if (filter.tenantId === undefined) {
      throw new Error(
        `Tenant-scoped query on "${this.model.modelName}" by _id must also filter by tenantId.`,
      );
    }
  };

  for (const op of GUARDED_OPS) schema.pre(op, guard);
}
