import { Collection } from '../collections/collection.model.js';
import { collectionsForShopFilter } from '../collections/collectionQueries.js';
import { CatalogProduct } from '../catalog/catalogProduct.model.js';

export const CATALOG_SELECT =
  'name brand group category description keyFeatures sizeGuide basePriceInr primaryImageUrl imageUrls maskImageUrl baseImageUrl variants printAreas';

/** One storefront row per Branded Swag design (collection × productRef). */
export function mapBrandedListing(col, ref, base) {
  const catalogProductId = String(ref.catalogProductId);
  const collectionId = String(col._id);
  return {
    ...base,
    _id: `${collectionId}:${catalogProductId}`,
    catalogProductId,
    collectionId,
    name: ref.name || base.name,
    brand: ref.brand ?? base.brand,
    group: ref.group ?? base.group,
    artworkUrl: col.artworkUrl || '',
    mockupUrl: ref.mockupUrl || '',
    placement: ref.placement ?? null,
    preferredColors: col.preferredColors || [],
  };
}

/** Accepts a catalog id or a branded listing id (`collectionId:catalogProductId`). */
export function parseBrandedListingProductId(productId) {
  const s = String(productId ?? '');
  const parts = s.split(':');
  if (parts.length === 2 && parts.every((p) => /^[a-f\d]{24}$/i.test(p))) {
    return { collectionId: parts[0], catalogProductId: parts[1] };
  }
  if (/^[a-f\d]{24}$/i.test(s)) {
    return { collectionId: null, catalogProductId: s };
  }
  return null;
}

export async function loadShopCollections(shop, { skipTenantGuard = true } = {}) {
  return Collection.find({
    ...collectionsForShopFilter(shop._id),
    tenantId: shop.tenantId,
    status: { $ne: 'archived' },
  })
    .setOptions(skipTenantGuard ? { skipTenantGuard: true } : undefined)
    .select('productRefs artworkUrl preferredColors')
    .lean();
}

/**
 * Public shop listings: one entry per active Branded Swag design that is also
 * enabled in Shop Catalog (`selectedCatalogProductIds`). Empty selection = none.
 */
export async function buildBrandedProductListings(shop, { skipTenantGuard = true } = {}) {
  const allowed = new Set((shop.selectedCatalogProductIds || []).map(String).filter(Boolean));
  if (!allowed.size) return [];

  const collections = await loadShopCollections(shop, { skipTenantGuard });
  const catalogIds = [];
  for (const col of collections) {
    for (const ref of col.productRefs || []) {
      if (ref.catalogProductId) catalogIds.push(String(ref.catalogProductId));
    }
  }
  const uniqueIds = [...new Set(catalogIds)].filter((id) => allowed.has(id));
  if (!uniqueIds.length) return [];

  const catalogRows = await CatalogProduct.find({
    status: 'active',
    _id: { $in: uniqueIds },
  })
    .setOptions(skipTenantGuard ? { skipTenantGuard: true } : undefined)
    .select(CATALOG_SELECT)
    .lean();

  const catalogById = new Map(catalogRows.map((row) => [String(row._id), row]));

  const products = [];
  for (const col of collections) {
    for (const ref of col.productRefs || []) {
      const catalogProductId = ref.catalogProductId ? String(ref.catalogProductId) : '';
      if (!catalogProductId || !allowed.has(catalogProductId)) continue;
      const base = catalogById.get(catalogProductId);
      if (!base) continue;
      products.push(mapBrandedListing(col, ref, base));
    }
  }

  products.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return products;
}

export function mockupUrlFromCollections(collections, collectionId, catalogProductId) {
  if (!collectionId) return '';
  const col = collections.find((c) => String(c._id) === collectionId);
  const ref = col?.productRefs?.find((r) => String(r.catalogProductId) === catalogProductId);
  return ref?.mockupUrl || '';
}

/** Branded listing metadata for order snapshots (collection × catalog product). */
export function resolveBrandedListingSnapshot(collections, listing) {
  const collectionId = listing.collectionId ? String(listing.collectionId) : '';
  const catalogProductId = String(listing.catalogProductId);
  const col = collectionId ? collections.find((c) => String(c._id) === collectionId) : null;
  const ref = col?.productRefs?.find((r) => String(r.catalogProductId) === catalogProductId) ?? null;
  return {
    collectionId,
    name: ref?.name || '',
    brand: ref?.brand || '',
    mockupUrl: ref?.mockupUrl || '',
    artworkUrl: col?.artworkUrl || '',
  };
}
