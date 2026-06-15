import crypto from 'node:crypto';
import { CatalogProduct } from './catalogProduct.model.js';
import { ApiError } from '../../utils/errors.js';

const SHOPIFY_API_VERSION = '2024-10';
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
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
export function mapShopifyProduct(p, domain) {
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

  return {
    name: p.title || 'Untitled product',
    description: stripHtml(p.body_html),
    brand: p.vendor || '',
    category: p.product_type || 'Imported',
    basePriceInr,
    variants,
    imageUrls: images,
    primaryImageUrl: p.image?.src || images[0] || '',
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

/** Import all products from a Shopify store; skip ones already imported. */
export async function importFromShopify({ domain, token }) {
  const host = normalizeDomain(domain);
  const products = await fetchShopifyProducts({ domain: host, token });

  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const items = [];

  for (const p of products) {
    const externalId = String(p.id);
    try {
      const exists = await CatalogProduct.findOne({
        'source.provider': 'shopify',
        'source.externalId': externalId,
      });
      if (exists) {
        skipped += 1;
        items.push({ title: p.title, status: 'skipped' });
        continue;
      }
      const mapped = mapShopifyProduct(p, host);
      mapped.sku = await uniqueSku(
        mapped.variants.find((v) => v.sku)?.sku || `SHOP-${externalId}`,
      );
      await CatalogProduct.create(mapped);
      imported += 1;
      items.push({ title: p.title, status: 'imported' });
    } catch (err) {
      failed += 1;
      items.push({ title: p?.title ?? externalId, status: 'failed', reason: err.message });
    }
  }

  return { domain: host, total: products.length, imported, skipped, failed, items };
}
