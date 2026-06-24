import crypto from 'node:crypto';
import { CatalogProduct } from './catalogProduct.model.js';
import { PlatformKit } from '../kits/platformKit.model.js';
import { ApiError } from '../../utils/errors.js';

const SHOPIFY_API_VERSION = '2024-10';
const SHOPIFY_GRAPHQL_API_VERSION = '2026-04';
const MAX_PAGES = 20; // safety cap (~5000 products at limit=250)

/** Strip protocol, trailing slash, and any /admin path → bare host. */
export function normalizeDomain(input) {
  if (!input || typeof input !== 'string') {
    throw new ApiError(422, 'A Shopify store domain is required', 'INVALID_DOMAIN');
  }
  const host = input
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .toLowerCase();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) {
    throw new ApiError(422, `"${input}" is not a valid store domain`, 'INVALID_DOMAIN');
  }
  return host;
}

function stripHtml(html = '') {
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<\/td>\s*<td[^>]*>/gi, ': ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripNonContent(html = '') {
  return String(html)
    .replace(/<(?:script|style|template|svg)\b[^>]*>[\s\S]*?<\/(?:script|style|template|svg)>/gi, ' ')
    .replace(/<button\b[^>]*>[\s\S]*?<\/button>/gi, ' ');
}

function tabSectionHtml(pageHtml, title) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const startPattern = new RegExp(
    `<div\\b[^>]*data-tab-title=["']${escaped}["'][^>]*>`,
    'i',
  );
  const start = startPattern.exec(pageHtml);
  if (!start) return '';
  const contentStart = start.index + start[0].length;
  const rest = pageHtml.slice(contentStart);
  const nextTab = /<div\b[^>]*data-tab-title=["'][^"']+["'][^>]*>/i.exec(rest);
  return rest.slice(0, nextTab?.index ?? rest.length);
}

function featureRowsFromHtml(sectionHtml) {
  const rows = [];
  for (const match of sectionHtml.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    const cells = [...match[1].matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((cell) => stripHtml(stripNonContent(cell[1])))
      .filter(Boolean);
    const value = cells.slice(1).join(' ');
    if (cells.length >= 2 && !/^(?:x[\s,]*)+$/i.test(value)) {
      rows.push(`${cells[0]}: ${value}`);
    }
    else if (cells.length === 1) rows.push(cells[0]);
  }
  return rows.join('\n');
}

/** Read the same product tabs a shopper sees on the public Shopify page. */
export function parseShopifyStorefrontTabs(pageHtml = '') {
  const descriptionHtml = tabSectionHtml(pageHtml, 'Description');
  const featuresHtml = tabSectionHtml(pageHtml, 'Key features')
    || tabSectionHtml(pageHtml, 'Key Features');
  const sizeGuideHtml = tabSectionHtml(pageHtml, 'Size Guide');

  const descriptionMetafield = /<span\b[^>]*class=["'][^"']*metafield-multi_line_text_field[^"']*["'][^>]*>([\s\S]*?)<\/span>/i
    .exec(descriptionHtml)?.[1];

  return {
    description: stripHtml(stripNonContent(descriptionMetafield || descriptionHtml))
      .replace(/\n?(?:Read more|See less)\s*$/i, '')
      .trim(),
    keyFeatures: featureRowsFromHtml(featuresHtml)
      || stripHtml(stripNonContent(featuresHtml)),
    sizeGuide: stripHtml(stripNonContent(sizeGuideHtml))
      .replace(/\n?(?:Read more|See less)\s*$/i, '')
      .trim(),
  };
}

function metafieldText(metafield) {
  const raw = String(metafield?.value ?? '').trim();
  if (!raw) return '';

  if (metafield?.type === 'rich_text_field') {
    try {
      const richText = JSON.parse(raw);
      const text = [];
      const visit = (node) => {
        if (!node || typeof node !== 'object') return;
        if (typeof node.value === 'string') text.push(node.value);
        for (const child of node.children ?? []) visit(child);
        if (['paragraph', 'list-item', 'heading'].includes(node.type)) text.push('\n');
      };
      visit(richText);
      return text.join('').replace(/\n{3,}/g, '\n\n').trim();
    } catch {
      return stripHtml(raw);
    }
  }

  if (metafield?.type?.startsWith('list.')) {
    try {
      const values = JSON.parse(raw);
      if (Array.isArray(values)) return values.map(String).join('\n');
    } catch {
      // Use the normal text cleanup below when the value is not JSON.
    }
  }

  return stripHtml(raw);
}

function normalizedKey(metafield) {
  return String(metafield?.key ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function titleFromKey(key) {
  return key
    .split('_')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

const DESCRIPTION_KEYS = new Set([
  'description',
  'product_description',
  'detailed_description',
  'description_text',
  'product_details',
]);
const SIZE_GUIDE_KEYS = new Set(['size_guide', 'size_chart', 'sizing_guide']);
const DIRECT_FEATURE_KEYS = new Set([
  'key_features',
  'key_feature',
  'product_features',
  'feature_details',
]);
const FEATURE_ROW_KEYS = new Set([
  'features',
  'material',
  'printing_types_supported',
  'printing_type_supported',
  'brand',
  'country_of_manufacturer',
  'country_of_origin',
  'care_instructions',
]);

/** Split Shopify's tab content into the catalog fields used by this app. */
export function mapShopifyContent(bodyHtml, metafields = []) {
  const byKey = new Map(metafields.map((field) => [normalizedKey(field), field]));
  const fields = [...byKey.entries()];
  const valueFor = (keys) => {
    for (const key of keys) {
      const value = metafieldText(byKey.get(key));
      if (value) return value;
    }
    return '';
  };
  const valueMatching = (predicate) => {
    const match = fields.find(([key, field]) => predicate(key) && metafieldText(field));
    return match ? metafieldText(match[1]) : '';
  };

  const metafieldDescription = valueFor(DESCRIPTION_KEYS)
    || valueMatching((key) => key.includes('description') && !key.includes('file'));
  const explicitSizeGuide = valueFor(SIZE_GUIDE_KEYS)
    || valueMatching((key) => key.includes('size') && (key.includes('guide') || key.includes('chart')));
  const bodyText = stripHtml(bodyHtml);
  const directFeatures = valueFor(DIRECT_FEATURE_KEYS)
    || valueMatching((key) => key.includes('key_feature') || key.includes('product_feature'));
  const featureRows = [...FEATURE_ROW_KEYS]
    .map((key) => {
      const value = metafieldText(byKey.get(key));
      return value ? `${titleFromKey(key)}: ${value}` : '';
    })
    .filter(Boolean)
    .join('\n');

  return {
    description: metafieldDescription || bodyText,
    keyFeatures: directFeatures || featureRows,
    // shelfmerch.store uses Shopify's normal product body for this tab.
    sizeGuide: explicitSizeGuide || (metafieldDescription ? bodyText : ''),
  };
}

/** Parse the RFC-5988 Link header for the next page_info cursor. */
function nextPageInfo(linkHeader) {
  if (!linkHeader) return null;
  const match = linkHeader.split(',').find((part) => part.includes('rel="next"'));
  if (!match) return null;
  const url = match.match(/<([^>]+)>/)?.[1];
  if (!url) return null;
  return new URL(url).searchParams.get('page_info');
}

/** Fetch all products from the Shopify Admin REST API (cursor-paginated). */
export async function fetchShopifyProducts({ domain, token }) {
  if (!token) throw new ApiError(422, 'A Shopify Admin API access token is required', 'TOKEN_REQUIRED');
  const base = `https://${domain}/admin/api/${SHOPIFY_API_VERSION}/products.json`;
  const products = [];
  let pageInfo = null;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const params = new URLSearchParams({ limit: '250' });
    if (pageInfo) params.set('page_info', pageInfo);
    let res;
    try {
      res = await fetch(`${base}?${params}`, {
        headers: { 'X-Shopify-Access-Token': token, Accept: 'application/json' },
      });
    } catch {
      throw new ApiError(502, `Could not reach Shopify store "${domain}"`, 'SHOPIFY_UNREACHABLE');
    }
    if (res.status === 401 || res.status === 403) {
      throw new ApiError(401, 'Invalid Shopify access token or domain', 'SHOPIFY_UNAUTHORIZED');
    }
    if (!res.ok) {
      throw new ApiError(502, `Shopify returned ${res.status} for "${domain}"`, 'SHOPIFY_ERROR');
    }
    const body = await res.json().catch(() => ({}));
    products.push(...(body.products ?? []));
    pageInfo = nextPageInfo(res.headers.get('link'));
    if (!pageInfo) break;
  }
  return products;
}

/** Map a Shopify product → CatalogProduct fields (status draft). */
export async function fetchShopifyProductMetafields({ domain, token, productId }) {
  let res;
  try {
    res = await fetch(
      `https://${domain}/admin/api/${SHOPIFY_API_VERSION}/products/${productId}/metafields.json?limit=250`,
      { headers: { 'X-Shopify-Access-Token': token, Accept: 'application/json' } },
    );
  } catch {
    throw new ApiError(
      502,
      `Could not fetch metafields for Shopify product "${productId}"`,
      'SHOPIFY_UNREACHABLE',
    );
  }
  if (res.status === 401 || res.status === 403) {
    throw new ApiError(401, 'Shopify token cannot read product metafields', 'SHOPIFY_UNAUTHORIZED');
  }
  if (!res.ok) {
    throw new ApiError(
      502,
      `Shopify returned ${res.status} while reading product metafields`,
      'SHOPIFY_ERROR',
    );
  }
  const body = await res.json().catch(() => ({}));
  return body.metafields ?? [];
}

/** Fetch Shopify's standard taxonomy category and merchant classification. */
export async function fetchShopifyProductCategory({ domain, token, productId }) {
  const query = `
    query ProductCategory($id: ID!) {
      product(id: $id) {
        productType
        category {
          name
          fullName
        }
        collections(first: 20) {
          nodes {
            title
            handle
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(
      `https://${domain}/admin/api/${SHOPIFY_GRAPHQL_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': token,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { id: `gid://shopify/Product/${productId}` },
        }),
      },
    );
    if (!res.ok) return null;
    const body = await res.json().catch(() => ({}));
    if (body.errors?.length) return null;
    return body.data?.product ?? null;
  } catch {
    // Category enrichment is optional; REST product_type remains the fallback.
    return null;
  }
}

function meaningfulCollectionTitle(collections = []) {
  const generic = /^(all|all products|catalog|featured|new arrivals?|best sellers?|frontpage)$/i;
  return collections
    .map((collection) => String(collection?.title ?? '').trim())
    .find((title) => title && !generic.test(title)) || '';
}

export function resolveShopifyCategory(product, categoryData) {
  return String(
    categoryData?.category?.name
      || categoryData?.productType
      || product?.product_type
      || meaningfulCollectionTitle(categoryData?.collections?.nodes)
      || 'Imported',
  ).trim();
}

/** Public-page fallback for theme tabs that are not returned by Admin metafields. */
export async function fetchShopifyStorefrontTabs({ domain, handle }) {
  if (!handle) return { description: '', keyFeatures: '', sizeGuide: '' };
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const res = await fetch(`https://${domain}/products/${encodeURIComponent(handle)}`, {
        headers: { Accept: 'text/html' },
        redirect: 'follow',
      });
      if (res.ok && typeof res.text === 'function') {
        return parseShopifyStorefrontTabs(await res.text());
      }
    } catch {
      // Retry occasional Shopify/CDN connection timeouts.
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
  // Product import should still work when the public storefront is unavailable.
  return { description: '', keyFeatures: '', sizeGuide: '' };
}

/** Map a Shopify product into CatalogProduct fields (status draft). */
export function mapShopifyProduct(p, domain, metafields = [], categoryData = null) {
  const optionNames = (p.options ?? []).map((o) => String(o.name || '').toLowerCase());
  const optKey = (i) =>
    optionNames[i]?.includes('size') ? 'size'
      : optionNames[i]?.includes('material') ? 'material'
        : optionNames[i]?.includes('color') || optionNames[i]?.includes('colour') ? 'color'
          : null;

  const variants = (p.variants ?? []).map((v) => {
    const out = {
      sku: v.sku || '',
      priceOverrideInr: v.price != null ? Number(v.price) : null,
      stock: Number(v.inventory_quantity ?? 0),
    };
    [v.option1, v.option2, v.option3].forEach((val, i) => {
      const key = optKey(i);
      if (key && val) out[key] = String(val);
    });
    return out;
  });

  const prices = (p.variants ?? []).map((v) => Number(v.price)).filter((n) => Number.isFinite(n));
  const basePriceInr = prices.length ? Math.min(...prices) : 0;
  const images = (p.images ?? []).map((img) => img.src).filter(Boolean);
  const content = mapShopifyContent(p.body_html, metafields);

  return {
    name: p.title || 'Untitled product',
    ...content,
    brand: p.vendor || '',
    category: resolveShopifyCategory(p, categoryData),
    basePriceInr,
    variants,
    primaryImageUrl: p.image?.src || images[0] || '',
    imageUrls: images,
    status: 'draft',
    // Imported products are fulfilled on demand, not warehoused — default to
    // made-to-order so they don't surface as "out of stock". A catalog admin
    // can switch a product to physical and restock it from the Inventory page.
    inventory: { mode: 'made_to_order' },
    source: {
      provider: 'shopify',
      domain,
      externalId: String(p.id),
      handle: p.handle || '',
    },
  };
}

async function uniqueSku(base) {
  let sku = base || `SM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  while (await CatalogProduct.findOne({ sku })) {
    sku = `${base}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  }
  return sku;
}

// Words that mark a Shopify product as a bundle/kit rather than a single item.
const KIT_WORD_RE = /\b(kits?|bundles?|combos?|hampers?|gift\s*(set|box|pack)|welcome\s*(kit|pack)|onboarding\s*(kit|pack)|sets?)\b/i;

/**
 * Classify a Shopify product as a kit (bundle of items) vs a single catalog
 * product, so imports can be sorted into the right collection. Signals, in order
 * of confidence: product_type / tags, an enumerated "kit includes …" body, then
 * the title. A bare "set" in the title alone is not enough (e.g. "Tee Set" sizes).
 */
export function isKitLikeShopifyProduct(p = {}) {
  const type = String(p.product_type || '');
  const tags = Array.isArray(p.tags) ? p.tags.join(' ') : String(p.tags || '');
  if (KIT_WORD_RE.test(type) || KIT_WORD_RE.test(tags)) return true;

  const body = stripHtml(p.body_html || '');
  // "This kit includes keychain, diary, bottle, pen" — an enumerated bundle.
  if (/\b(kit|bundle|set|pack|combo|hamper)\b[^.]*\bincludes?\b/i.test(body)) return true;
  if (/\bincludes?\b[^.]*,[^.]*\b(and|&|,)\b/i.test(body) && KIT_WORD_RE.test(p.title || '')) return true;

  // Strong title words (kit/bundle/combo/hamper/gift box) on their own qualify.
  if (/\b(kits?|bundles?|combos?|hampers?|gift\s*(set|box|pack))\b/i.test(p.title || '')) return true;
  return false;
}

/**
 * Map a Shopify product into PlatformKit fields. Shopify bundles are already
 * curated, self-contained products — there are no component products/variants to
 * compose — so they import as `active` with empty `items` and are marked
 * fixed-composition. The Edit-kits item flow does not apply to them.
 */
export function mapShopifyKit(p, domain, mapped) {
  return {
    name: mapped.name,
    description: mapped.description || '',
    packaging: 'box',
    approxValueInr: mapped.basePriceInr || 0,
    imageUrls: mapped.imageUrls || [],
    items: [],
    rules: { fixedComposition: true, customizationAllowed: true, minQtyPerRecipient: 1, maxQtyPerRecipient: 1 },
    status: 'active',
    source: {
      provider: 'shopify',
      domain,
      externalId: String(p.id),
      handle: p.handle || '',
    },
  };
}

/**
 * Import products from a Shopify store; skip ones already imported.
 * `only` sorts the import: 'products' brings in just catalog products, 'kits'
 * brings in just kit bundles, 'all' (default) does both.
 */
export async function importFromShopify({ domain, token, only = 'all' }) {
  const host = normalizeDomain(domain);
  const products = await fetchShopifyProducts({ domain: host, token });

  // Counts are tracked per kind so kits and catalog products are sorted apart.
  const product = { imported: 0, updated: 0, skipped: 0 };
  const kit = { imported: 0, updated: 0, skipped: 0 };
  let failed = 0;
  const items = [];

  for (const p of products) {
    const externalId = String(p.id);
    try {
      // Classify up front (from the product list alone) so a filtered import
      // skips the per-product metafield/tab fetches it doesn't need.
      const kitLike = isKitLikeShopifyProduct(p);
      if (only === 'kits' && !kitLike) continue;
      if (only === 'products' && kitLike) continue;

      const metafields = await fetchShopifyProductMetafields({
        domain: host,
        token,
        productId: externalId,
      });
      const categoryData = await fetchShopifyProductCategory({
        domain: host,
        token,
        productId: externalId,
      });
      const mapped = mapShopifyProduct(p, host, metafields, categoryData);
      if (!mapped.keyFeatures || mapped.description === stripHtml(p.body_html)) {
        const storefrontTabs = await fetchShopifyStorefrontTabs({
          domain: host,
          handle: p.handle,
        });
        if (storefrontTabs.description) mapped.description = storefrontTabs.description;
        if (storefrontTabs.keyFeatures) mapped.keyFeatures = storefrontTabs.keyFeatures;
        if (storefrontTabs.sizeGuide) mapped.sizeGuide = storefrontTabs.sizeGuide;
        if (!mapped.sizeGuide && storefrontTabs.description) {
          mapped.sizeGuide = stripHtml(p.body_html);
        }
      }

      // Bundles/kits belong in the PlatformKit collection, not the catalog.
      if (kitLike) {
        const kitFields = mapShopifyKit(p, host, mapped);
        // A Shopify bundle previously imported as a single catalog product is
        // archived out of the catalog so it is not double-listed.
        await CatalogProduct.updateOne(
          { 'source.provider': 'shopify', 'source.externalId': externalId, status: { $ne: 'archived' } },
          { $set: { status: 'archived' } },
        );
        const existingKit = await PlatformKit.findOne({
          'source.provider': 'shopify',
          'source.externalId': externalId,
        });
        if (existingKit) {
          const changed =
            existingKit.name !== kitFields.name
            || String(existingKit.description ?? '') !== String(kitFields.description ?? '')
            || JSON.stringify(existingKit.imageUrls ?? []) !== JSON.stringify(kitFields.imageUrls ?? []);
          if (changed) {
            existingKit.name = kitFields.name;
            existingKit.description = kitFields.description;
            existingKit.imageUrls = kitFields.imageUrls;
            existingKit.approxValueInr = kitFields.approxValueInr;
            await existingKit.save();
            kit.updated += 1;
            items.push({ title: p.title, status: 'updated', kind: 'kit' });
          } else {
            kit.skipped += 1;
            items.push({ title: p.title, status: 'skipped', kind: 'kit' });
          }
        } else {
          await PlatformKit.create(kitFields);
          kit.imported += 1;
          items.push({ title: p.title, status: 'imported', kind: 'kit' });
        }
        continue;
      }

      const exists = await CatalogProduct.findOne({
        'source.provider': 'shopify',
        'source.externalId': externalId,
      });
      if (exists) {
        const contentChanged = ['description', 'keyFeatures', 'sizeGuide', 'category']
          .some((key) => String(exists[key] ?? '') !== String(mapped[key] ?? ''));
        const imagesChanged =
          String(exists.primaryImageUrl ?? '') !== String(mapped.primaryImageUrl ?? '')
          || JSON.stringify(exists.imageUrls ?? []) !== JSON.stringify(mapped.imageUrls ?? []);
        const legacyShopifyMask = [mapped.primaryImageUrl, ...mapped.imageUrls]
          .filter(Boolean)
          .includes(exists.maskImageUrl);
        if (contentChanged || imagesChanged || legacyShopifyMask) {
          exists.description = mapped.description;
          exists.keyFeatures = mapped.keyFeatures;
          exists.sizeGuide = mapped.sizeGuide;

          exists.primaryImageUrl = mapped.primaryImageUrl;
          exists.imageUrls = mapped.imageUrls;
          // Older imports stored the Shopify photo as the production mask.
          // Clear only that legacy value; preserve a manually uploaded mask.
          if (legacyShopifyMask) exists.maskImageUrl = '';

          exists.category = mapped.category;
          await exists.save();
          product.updated += 1;
          items.push({ title: p.title, status: 'updated', kind: 'product' });
        } else {
          product.skipped += 1;
          items.push({ title: p.title, status: 'skipped', kind: 'product' });
        }
        continue;
      }
      mapped.sku = await uniqueSku(
        mapped.variants.find((v) => v.sku)?.sku || `SHOP-${externalId}`,
      );
      await CatalogProduct.create(mapped);
      product.imported += 1;
      items.push({ title: p.title, status: 'imported', kind: 'product' });
    } catch (err) {
      failed += 1;
      items.push({ title: p?.title ?? externalId, status: 'failed', reason: err.message });
    }
  }

  return {
    domain: host,
    total: products.length,
    // Grand totals (back-compat) plus the kit/product split.
    imported: product.imported + kit.imported,
    updated: product.updated + kit.updated,
    skipped: product.skipped + kit.skipped,
    failed,
    products: product,
    kits: kit,
    items,
  };
}
