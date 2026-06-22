import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { CatalogProduct } from '../modules/catalog/catalogProduct.model.js';
import { fetchShopifyStorefrontTabs } from '../modules/catalog/shopifyImport.service.js';

const CONCURRENCY = 1;
const REQUEST_DELAY_MS = 750;

async function repairProduct(product) {
  const tabs = await fetchShopifyStorefrontTabs({
    domain: product.source?.domain,
    handle: product.source?.handle,
  });

  const missing = ['description', 'keyFeatures', 'sizeGuide'].filter(
    (key) => !String(tabs[key] ?? '').trim(),
  );
  if (missing.length) {
    return {
      status: 'failed',
      id: String(product._id),
      name: product.name,
      handle: product.source?.handle,
      reason: `Missing storefront tabs: ${missing.join(', ')}`,
    };
  }

  const changed = ['description', 'keyFeatures', 'sizeGuide'].some(
    (key) => String(product[key] ?? '') !== String(tabs[key] ?? ''),
  );
  if (!changed) return { status: 'unchanged', id: String(product._id), name: product.name };

  product.description = tabs.description;
  product.keyFeatures = tabs.keyFeatures;
  product.sizeGuide = tabs.sizeGuide;
  await product.save();
  return { status: 'updated', id: String(product._id), name: product.name };
}

async function main() {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 15_000 });
  const products = await CatalogProduct.find({
    'source.provider': 'shopify',
    $or: [
      { keyFeatures: { $exists: false } },
      { keyFeatures: '' },
      { sizeGuide: { $exists: false } },
      { sizeGuide: '' },
    ],
  })
    .select('name description keyFeatures sizeGuide source')
    .sort({ name: 1 });

  const results = [];
  for (let offset = 0; offset < products.length; offset += CONCURRENCY) {
    const batch = products.slice(offset, offset + CONCURRENCY);
    results.push(...await Promise.all(batch.map(async (product) => {
      try {
        return await repairProduct(product);
      } catch (error) {
        return {
          status: 'failed',
          id: String(product._id),
          name: product.name,
          handle: product.source?.handle,
          reason: error instanceof Error ? error.message : String(error),
        };
      }
    })));

    const completed = Math.min(offset + batch.length, products.length);
    const updated = results.filter((result) => result.status === 'updated').length;
    const failed = results.filter((result) => result.status === 'failed').length;
    console.log(JSON.stringify({ progress: `${completed}/${products.length}`, updated, failed }));
    await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
  }

  const summary = {
    total: products.length,
    updated: results.filter((result) => result.status === 'updated').length,
    unchanged: results.filter((result) => result.status === 'unchanged').length,
    failed: results.filter((result) => result.status === 'failed'),
  };
  console.log(JSON.stringify(summary, null, 2));
  await mongoose.disconnect();
  if (summary.failed.length) process.exitCode = 1;
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
