/**
 * Convert legacy `status: "trial"` tenants to `active` for Phase 1.
 *
 * Usage:
 *   node src/scripts/migrate-trial-tenants.js --dry-run
 *   node src/scripts/migrate-trial-tenants.js
 *
 * Does not run automatically. Safe to re-run (only matches status=trial).
 */
import { connectDb, disconnectDb } from '../config/db.js';
import { logger } from '../config/logger.js';
import { Tenant } from '../modules/tenants/tenant.model.js';

const dryRun = process.argv.includes('--dry-run');

async function main() {
  await connectDb();

  const filter = { status: 'trial' };
  const tenants = await Tenant.find(filter).select('_id name slug status').lean();

  logger.info({ count: tenants.length, dryRun }, 'Legacy trial tenants found');

  for (const t of tenants) {
    logger.info(
      { id: String(t._id), name: t.name, slug: t.slug },
      dryRun ? 'would set status active' : 'setting status active',
    );
  }

  if (!dryRun && tenants.length) {
    const result = await Tenant.updateMany(filter, { $set: { status: 'active' } });
    logger.info({ matched: result.matchedCount, modified: result.modifiedCount }, 'Migration applied');
  }

  await disconnectDb();
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
