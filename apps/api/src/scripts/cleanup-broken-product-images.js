/**
 * Archive catalog products whose primary image points to a missing local upload file.
 * Usage: node src/scripts/cleanup-broken-product-images.js [--dry-run]
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import { connectDb, disconnectDb } from '../config/db.js';
import { logger } from '../config/logger.js';
import { CatalogProduct } from '../modules/catalog/catalogProduct.model.js';
import { LOCAL_UPLOAD_DIR } from '../services/storage.service.js';

const dryRun = process.argv.includes('--dry-run');

function productImageUrl(product) {
  return product.maskImageUrl || product.primaryImageUrl || product.imageUrls?.[0] || '';
}

async function localUploadMissing(url) {
  if (!url.startsWith('/uploads/')) return false;
  const rel = url.slice('/uploads/'.length).replaceAll('/', path.sep);
  const filePath = path.join(LOCAL_UPLOAD_DIR, rel);
  try {
    await fs.access(filePath);
    return false;
  } catch {
    return true;
  }
}

async function main() {
  await connectDb();
  const products = await CatalogProduct.find({ status: 'active' });
  const broken = [];

  for (const product of products) {
    const url = productImageUrl(product);
    if (!url) {
      broken.push({ product, url, reason: 'no image' });
      continue;
    }
    if (await localUploadMissing(url)) {
      broken.push({ product, url, reason: 'missing file' });
    }
  }

  if (!broken.length) {
    logger.info('No products with broken local image URLs found');
    await disconnectDb();
    return;
  }

  for (const { product, url, reason } of broken) {
    logger.info({ sku: product.sku, name: product.name, url, reason }, dryRun ? 'would archive' : 'archiving');
    if (!dryRun) {
      product.status = 'archived';
      await product.save();
    }
  }

  logger.info(
    { count: broken.length, dryRun },
    dryRun ? 'Dry run complete — no changes written' : 'Archived products with broken images',
  );
  await disconnectDb();
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
