import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const uri = process.env.MONGO_URL || process.env.MONGODB_URI;
if (!uri) {
  console.error('Missing MONGO_URL');
  process.exit(1);
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

function score(urls, items, vars, hero) {
  return urls.length * 10 + items.length * 5 + vars.length * 2 + (hero ? 3 : 0);
}

function collectFromRoles(pk) {
  const urls = [];
  if (pk.heroImage) urls.push(pk.heroImage);
  for (const it of pk.itemImages || []) if (it?.imageUrl) urls.push(it.imageUrl);
  for (const v of pk.variantImages || []) if (v) urls.push(v);
  return uniqueUrls(urls);
}

async function main() {
  const apply = process.argv.includes('--apply');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db;

  const platformKits = await db.collection('platformkits').find({}).toArray();
  const workspaceKits = await db.collection('kits').find({ designNotes: { $regex: 'curated' } }).toArray();
  let customisedKits = [];
  try {
    customisedKits = await db.collection('customisedkits').find({ designNotes: { $regex: 'curated' } }).toArray();
  } catch {
    customisedKits = [];
  }

  const byOriginal = new Map();
  const byName = new Map();

  function consider(meta, artworkUrl, kitId, kitName) {
    if (!meta) return;
    const urls = Array.isArray(meta.imageUrls) ? meta.imageUrls.filter(Boolean) : [];
    const items = Array.isArray(meta.itemImages) ? meta.itemImages.filter((i) => i?.imageUrl) : [];
    const vars = Array.isArray(meta.variantImages) ? meta.variantImages.filter(Boolean) : [];
    const hero = String(meta.heroImage || '').trim() || artworkUrl || urls[0] || '';
    const payload = {
      urls: uniqueUrls(urls),
      items,
      vars,
      hero,
      score: score(urls, items, vars, hero),
      fromKit: kitId,
    };
    if (meta.originalId) {
      const key = String(meta.originalId);
      const prev = byOriginal.get(key);
      if (!prev || payload.score > prev.score) byOriginal.set(key, payload);
    }
    if (kitName) {
      const n = String(kitName).trim().toLowerCase();
      const prev = byName.get(n);
      if (!prev || payload.score > prev.score) byName.set(n, payload);
    }
  }

  for (const wk of [...workspaceKits, ...customisedKits]) {
    consider(parseMeta(wk.designNotes), wk.artworkUrl, String(wk._id), wk.name);
  }

  const updates = [];
  for (const pk of platformKits) {
    const id = String(pk._id);
    const currentUrls = uniqueUrls(pk.imageUrls || []);
    const recovered = byOriginal.get(id) || byName.get(String(pk.name || '').trim().toLowerCase());
    const fromRoles = collectFromRoles(pk);

    let imageUrls = currentUrls;
    let heroImage = String(pk.heroImage || '').trim();
    let itemImages = Array.isArray(pk.itemImages) ? [...pk.itemImages] : [];
    let variantImages = Array.isArray(pk.variantImages) ? [...pk.variantImages] : [];
    let changed = false;
    let source = 'roles';

    if (!imageUrls.length && fromRoles.length) {
      imageUrls = fromRoles;
      changed = true;
      source = 'roles';
    }

    if (recovered) {
      source = recovered.fromKit;
      if (!imageUrls.length && recovered.urls.length) {
        imageUrls = recovered.urls;
        changed = true;
      }
      if (!heroImage && recovered.hero) {
        heroImage = recovered.hero;
        changed = true;
      }
      if (!itemImages.length && recovered.items.length) {
        itemImages = recovered.items.map((it) => ({
          imageUrl: it.imageUrl,
          label: it.label || '',
        }));
        changed = true;
      }
      if (!variantImages.length && recovered.vars.length) {
        variantImages = recovered.vars;
        changed = true;
      }
      // Ensure imageUrls includes all role URLs
      const merged = uniqueUrls([
        ...imageUrls,
        heroImage,
        ...itemImages.map((i) => i.imageUrl),
        ...variantImages,
      ]);
      if (merged.length > imageUrls.length) {
        imageUrls = merged;
        changed = true;
      }
    } else if (imageUrls.length && fromRoles.length) {
      const merged = uniqueUrls([...imageUrls, ...fromRoles]);
      if (merged.length > imageUrls.length) {
        imageUrls = merged;
        changed = true;
      }
    }

    if (!changed) {
      if (!imageUrls.length) console.log(`NO SOURCE  ${id}  ${pk.name}`);
      continue;
    }

    updates.push({
      id: pk._id,
      name: pk.name,
      source,
      next: { imageUrls, heroImage, itemImages, variantImages },
    });
    console.log(
      `${apply ? 'RESTORE' : 'WOULD RESTORE'}  ${id}  ${pk.name}  urls=${imageUrls.length} hero=${!!heroImage} items=${itemImages.length} vars=${variantImages.length} via=${source}`,
    );
  }

  if (!apply) {
    console.log(`\nDry run only. Re-run with --apply to write ${updates.length} kit(s).`);
  } else {
    for (const u of updates) {
      await db.collection('platformkits').updateOne(
        { _id: u.id },
        {
          $set: {
            imageUrls: u.next.imageUrls,
            heroImage: u.next.heroImage,
            itemImages: u.next.itemImages,
            variantImages: u.next.variantImages,
            updatedAt: new Date(),
          },
        },
      );
    }
    console.log(`\nRestored ${updates.length} platform kit(s).`);
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
