/**
 * Restore ONLY approxValueInr for PlatformKits currently at 0,
 * using public Shopify product JSON (same source used at import).
 *
 * Safety:
 * - Does NOT touch imageUrls, heroImage, itemImages, variantImages, items, rules, etc.
 * - Only updates docs where approxValueInr is 0/missing.
 * - Requires source.provider=shopify + matching handle/domain.
 * - Refuses kitPrice/clone guesses.
 *
 * Usage:
 *   node src/scripts/restore-platform-kit-prices.js          # dry run
 *   node src/scripts/restore-platform-kit-prices.js --apply  # write
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const uri = process.env.MONGO_URL || process.env.MONGODB_URI;

async function fetchShopifyPrice(domain, handle) {
  const url = `https://${domain}/products/${handle}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Shopify fetch failed ${res.status} for ${url}`);
  const data = await res.json();
  const product = data?.product;
  if (!product) throw new Error(`No product in Shopify response for ${handle}`);
  const price = Number(product.variants?.[0]?.price);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Invalid Shopify price for ${handle}: ${product.variants?.[0]?.price}`);
  }
  // Sanity: external id must match when present
  return {
    price: Math.round(price),
    shopifyId: String(product.id),
    title: product.title,
  };
}

async function main() {
  const apply = process.argv.includes('--apply');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db;

  const candidates = await db.collection('platformkits').find({
    $or: [{ approxValueInr: 0 }, { approxValueInr: null }, { approxValueInr: { $exists: false } }],
  }).toArray();

  console.log(`Candidates with approxValueInr=0: ${candidates.length}`);
  const updates = [];

  for (const pk of candidates) {
    const domain = pk.source?.domain;
    const handle = pk.source?.handle;
    const provider = pk.source?.provider;
    const externalId = pk.source?.externalId ? String(pk.source.externalId) : '';

    if (provider !== 'shopify' || !domain || !handle) {
      console.log(`SKIP (no shopify source)  ${pk._id}  ${pk.name}`);
      continue;
    }

    // Triple-check current DB value right before planning write
    const fresh = await db.collection('platformkits').findOne(
      { _id: pk._id },
      { projection: { approxValueInr: 1, name: 1, source: 1 } },
    );
    if (!fresh || Number(fresh.approxValueInr) > 0) {
      console.log(`SKIP (already has price)  ${pk._id}  ${fresh?.approxValueInr}`);
      continue;
    }

    const shopify = await fetchShopifyPrice(domain, handle);
    if (externalId && shopify.shopifyId !== externalId) {
      console.log(
        `SKIP (shopify id mismatch)  ${pk._id}  db=${externalId} shopify=${shopify.shopifyId}`,
      );
      continue;
    }

    updates.push({
      id: pk._id,
      name: pk.name,
      from: Number(fresh.approxValueInr) || 0,
      to: shopify.price,
      shopifyTitle: shopify.title,
      handle,
    });
    console.log(
      `${apply ? 'RESTORE' : 'WOULD RESTORE'}  ${pk._id}  ${pk.name}  ${0} -> ${shopify.price}  (${shopify.title})`,
    );
  }

  if (!apply) {
    console.log(`\nDry run only. ${updates.length} safe price restore(s) available.`);
    console.log('Re-run with --apply to write ONLY approxValueInr on those docs.');
  } else {
    for (const u of updates) {
      // Final guard: update only if still 0
      const result = await db.collection('platformkits').updateOne(
        {
          _id: u.id,
          $or: [{ approxValueInr: 0 }, { approxValueInr: null }, { approxValueInr: { $exists: false } }],
        },
        { $set: { approxValueInr: u.to, updatedAt: new Date() } },
      );
      console.log(
        `WROTE  ${u.id}  matched=${result.matchedCount} modified=${result.modifiedCount} approxValueInr=${u.to}`,
      );
    }
    console.log(`\nDone. Restored approxValueInr on ${updates.length} kit(s). No other fields touched.`);
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
