/**
 * Restore ONLY empty PlatformKit content fields:
 * - description (storefront tab, then workspace clone backup)
 * - itemImages / variantImages (when empty — inferred from imageUrls + clone)
 * - itemImages[].label (only where label is currently empty — from Shopify component table)
 *
 * Safety:
 * - Never overwrites non-empty description, labels, itemImages, or variantImages.
 * - Requires source.provider=shopify + matching handle/domain for Shopify fetches.
 *
 * Usage:
 *   node src/scripts/restore-platform-kit-descriptions.js          # dry run
 *   node src/scripts/restore-platform-kit-descriptions.js --apply  # write
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  fetchShopifyStorefrontTabs,
  mapShopifyContent,
} from '../modules/catalog/shopifyImport.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const uri = process.env.MONGO_URL || process.env.MONGODB_URI;

function isEmpty(value) {
  return !String(value ?? '').trim();
}

function uniqueUrls(urls) {
  const out = [];
  const seen = new Set();
  for (const u of urls) {
    const url = String(u || '').trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

function parseMeta(designNotes) {
  try {
    const parsed = JSON.parse(designNotes || '{}');
    if (parsed?.curated) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function parseComponentLabels(bodyHtml) {
  const mapped = mapShopifyContent(bodyHtml || '', []);
  const lines = String(mapped.description || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const labels = [];
  for (const line of lines) {
    if (/^product component/i.test(line)) continue;
    const name = line.split(':')[0]?.trim();
    if (name) labels.push(name);
  }
  return labels;
}

function inferBundleRoles(imageUrls, heroImage) {
  const hero = String(heroImage || '').trim() || imageUrls[0] || '';
  const rest = imageUrls.filter((url) => url !== hero);
  const variantCandidates = rest.filter((url) => /ChatGPT|variant|_v\d/i.test(url));
  const itemCandidates = rest.filter((url) => !variantCandidates.includes(url));
  return { hero, itemCandidates, variantCandidates };
}

async function fetchShopifyProduct(domain, handle) {
  const url = `https://${domain}/products/${handle}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Shopify fetch failed ${res.status} for ${url}`);
  const data = await res.json();
  const product = data?.product;
  if (!product) throw new Error(`No product in Shopify response for ${handle}`);
  return product;
}

async function loadCloneBackup(db, platformKitId) {
  const clones = await db.collection('kits').find({
    designNotes: { $regex: String(platformKitId) },
  }).toArray();
  let best = null;
  for (const clone of clones) {
    const meta = parseMeta(clone.designNotes);
    if (!meta || String(meta.originalId) !== String(platformKitId)) continue;
    const score =
      (meta.description ? 10 : 0)
      + (Array.isArray(meta.itemImages) ? meta.itemImages.length * 3 : 0)
      + (Array.isArray(meta.variantImages) ? meta.variantImages.length : 0)
      + (meta.heroImage ? 2 : 0);
    if (!best || score > best.score) best = { meta, score, cloneId: String(clone._id) };
  }
  return best;
}

async function main() {
  const apply = process.argv.includes('--apply');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db;

  const kits = await db.collection('platformkits').find({}).toArray();
  const updates = [];

  for (const pk of kits) {
    const domain = pk.source?.domain;
    const handle = pk.source?.handle;
    const provider = pk.source?.provider;
    const externalId = pk.source?.externalId ? String(pk.source.externalId) : '';
    const id = pk._id;

    const fresh = await db.collection('platformkits').findOne({ _id: id });
    if (!fresh) continue;

    const descriptionMissing = isEmpty(fresh.description);
    const currentItems = Array.isArray(fresh.itemImages) ? fresh.itemImages : [];
    const labelsMissing = currentItems.some((it) => isEmpty(it.label));

    // Only touch kits that lost curated content (empty description and/or empty item labels).
    if (!descriptionMissing && !labelsMissing) continue;

    const patch = {};
    const notes = [];

    // --- description ---
    if (descriptionMissing) {
      let description = '';
      const clone = await loadCloneBackup(db, id);
      if (clone?.meta?.description && !isEmpty(clone.meta.description)) {
        description = String(clone.meta.description).trim();
        notes.push(`description from clone ${clone.cloneId}`);
      } else if (provider === 'shopify' && domain && handle) {
        const tabs = await fetchShopifyStorefrontTabs({ domain, handle });
        description = String(tabs.description || '').trim();
        if (!description) {
          const product = await fetchShopifyProduct(domain, handle);
          description = String(mapShopifyContent(product.body_html || '', []).description || '').trim();
        }
        notes.push('description from Shopify');
      }
      if (description) patch.description = description;
    }

    // --- itemImages / variantImages (only when description was wiped too) ---
    const currentVariants = Array.isArray(fresh.variantImages) ? fresh.variantImages : [];
    const imageUrls = uniqueUrls(fresh.imageUrls || []);
    const heroImage = String(fresh.heroImage || '').trim() || imageUrls[0] || '';

    if (descriptionMissing && !currentItems.length && imageUrls.length) {
      const clone = await loadCloneBackup(db, id);
      if (clone?.meta?.itemImages?.length) {
        patch.itemImages = clone.meta.itemImages.map((it) => ({
          imageUrl: it.imageUrl,
          label: it.label || '',
        }));
        notes.push('itemImages from clone');
      } else {
        const { itemCandidates } = inferBundleRoles(imageUrls, heroImage);
        if (itemCandidates.length) {
          patch.itemImages = itemCandidates.map((imageUrl) => ({ imageUrl, label: '' }));
          notes.push(`itemImages inferred (${itemCandidates.length})`);
        }
      }
    }

    if (descriptionMissing && !currentVariants.length && imageUrls.length) {
      const clone = await loadCloneBackup(db, id);
      if (clone?.meta?.variantImages?.length) {
        patch.variantImages = [...clone.meta.variantImages];
        notes.push('variantImages from clone');
      } else {
        const { variantCandidates } = inferBundleRoles(imageUrls, heroImage);
        if (variantCandidates.length) {
          patch.variantImages = variantCandidates;
          notes.push(`variantImages inferred (${variantCandidates.length})`);
        }
      }
    }

    // --- itemImages labels (only fill empty labels) ---
    const itemsForLabels = patch.itemImages || currentItems;
    if ((descriptionMissing || labelsMissing) && itemsForLabels.length && provider === 'shopify' && domain && handle) {
      const needsLabels = itemsForLabels.some((it) => isEmpty(it.label));
      if (needsLabels) {
        const product = await fetchShopifyProduct(domain, handle);
        if (externalId && String(product.id) !== externalId) {
          notes.push('SKIP labels — shopify id mismatch');
        } else {
          const labels = parseComponentLabels(product.body_html);
          if (labels.length) {
            const labeled = itemsForLabels.map((it, idx) => ({
              imageUrl: it.imageUrl,
              label: isEmpty(it.label) ? (labels[idx] || '') : String(it.label).trim(),
            }));
            const changed = labeled.some((it, idx) => it.label !== (itemsForLabels[idx]?.label || ''));
            if (changed) {
              patch.itemImages = labeled;
              notes.push(`labels from Shopify (${labels.join(', ')})`);
            }
          }
        }
      }
    }

    if (!Object.keys(patch).length) continue;

    updates.push({ id, name: fresh.name, patch, notes });
    console.log(`${apply ? 'RESTORE' : 'WOULD RESTORE'}  ${id}  ${fresh.name}`);
    for (const n of notes) console.log(`  - ${n}`);
    if (patch.description) {
      console.log(`  desc preview: ${patch.description.slice(0, 140)}...`);
    }
    if (patch.itemImages) {
      console.log(`  itemImages: ${JSON.stringify(patch.itemImages.map((it) => ({ label: it.label, url: it.imageUrl.slice(-24) })))}`);
    }
    if (patch.variantImages) {
      console.log(`  variantImages: ${patch.variantImages.length}`);
    }
  }

  if (!apply) {
    console.log(`\nDry run only. ${updates.length} kit(s) can be restored safely.`);
    console.log('Re-run with --apply to write ONLY the empty fields listed above.');
  } else {
    for (const u of updates) {
      if (u.patch.description) {
        const result = await db.collection('platformkits').updateOne(
          {
            _id: u.id,
            $or: [
              { description: '' },
              { description: null },
              { description: { $exists: false } },
            ],
          },
          { $set: { description: u.patch.description, updatedAt: new Date() } },
        );
        console.log(`WROTE description  ${u.id}  modified=${result.modifiedCount}`);
      }

      if (u.patch.itemImages) {
        const fresh = await db.collection('platformkits').findOne(
          { _id: u.id },
          { projection: { itemImages: 1 } },
        );
        const existing = Array.isArray(fresh?.itemImages) ? fresh.itemImages : [];
        if (!existing.length) {
          const result = await db.collection('platformkits').updateOne(
            {
              _id: u.id,
              $or: [
                { itemImages: { $exists: false } },
                { itemImages: null },
                { itemImages: { $size: 0 } },
              ],
            },
            { $set: { itemImages: u.patch.itemImages, updatedAt: new Date() } },
          );
          console.log(`WROTE itemImages  ${u.id}  modified=${result.modifiedCount}`);
        } else {
          const labeled = existing.map((it, idx) => ({
            imageUrl: it.imageUrl,
            label: isEmpty(it.label)
              ? (u.patch.itemImages[idx]?.label || '')
              : String(it.label).trim(),
          }));
          const result = await db.collection('platformkits').updateOne(
            { _id: u.id },
            { $set: { itemImages: labeled, updatedAt: new Date() } },
          );
          console.log(`WROTE item labels  ${u.id}  modified=${result.modifiedCount}`);
        }
      }

      if (u.patch.variantImages) {
        const result = await db.collection('platformkits').updateOne(
          {
            _id: u.id,
            $or: [
              { variantImages: { $exists: false } },
              { variantImages: null },
              { variantImages: { $size: 0 } },
            ],
          },
          { $set: { variantImages: u.patch.variantImages, updatedAt: new Date() } },
        );
        console.log(`WROTE variantImages  ${u.id}  modified=${result.modifiedCount}`);
      }
    }
    console.log(`\nDone. Restored content on ${updates.length} kit(s). Existing non-empty fields untouched.`);
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
