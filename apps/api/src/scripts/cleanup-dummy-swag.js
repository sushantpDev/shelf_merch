/**
 * Remove seed/demo swag from tenant collections — drops refs to archived catalog
 * products and deletes collections that end up empty.
 * Usage: node src/scripts/cleanup-dummy-swag.js [--dry-run]
 */
import mongoose from 'mongoose';
import { connectDb, disconnectDb } from '../config/db.js';
import { logger } from '../config/logger.js';
import { CatalogProduct } from '../modules/catalog/catalogProduct.model.js';
import { Collection } from '../modules/collections/collection.model.js';

const dryRun = process.argv.includes('--dry-run');

async function isActiveCatalogRef(ref) {
  if (!ref?.catalogProductId) return false;
  const product = await CatalogProduct.findById(ref.catalogProductId).select('status').lean();
  return product?.status === 'active';
}

async function main() {
  await connectDb();
  const collections = await Collection.find({}).setOptions({ skipTenantGuard: true });
  let removedRefs = 0;
  let deletedCollections = 0;

  for (const col of collections) {
    const kept = [];
    for (const ref of col.productRefs || []) {
      if (await isActiveCatalogRef(ref)) {
        kept.push(ref);
      } else {
        logger.info({ collection: col.name, product: ref.name }, dryRun ? 'would remove ref' : 'removing ref');
        removedRefs += 1;
      }
    }

    if (!kept.length) {
      logger.info({ collection: col.name, id: col._id }, dryRun ? 'would delete collection' : 'deleting collection');
      if (!dryRun) {
        await Collection.deleteOne({ _id: col._id, tenantId: col.tenantId }).setOptions({ skipTenantGuard: true });
      }
      deletedCollections += 1;
      continue;
    }

    if (kept.length !== (col.productRefs?.length || 0)) {
      if (!dryRun) {
        col.productRefs = kept;
        await col.save();
      }
    }
  }

  logger.info({ removedRefs, deletedCollections, dryRun }, 'Dummy swag cleanup complete');
  await disconnectDb();
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
