import { Shop } from '../shops/shop.model.js';
import { Collection } from '../collections/collection.model.js';
import { collectionsForShopFilter } from '../collections/collectionQueries.js';
import { CatalogProduct } from '../catalog/catalogProduct.model.js';
import { NotFoundError } from '../../utils/errors.js';

const CATALOG_SELECT =
  'name brand group category description keyFeatures sizeGuide basePriceInr primaryImageUrl imageUrls maskImageUrl baseImageUrl variants printAreas';

function mapBrandedListing(col, ref, base) {
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
    preferredColors: col.preferredColors || [],
  };
}

function mapPlainListing(base) {
  const catalogProductId = String(base._id);
  return {
    ...base,
    _id: catalogProductId,
    catalogProductId,
    collectionId: '',
    artworkUrl: '',
    mockupUrl: '',
    preferredColors: [],
  };
}

/**
 * Public, no-auth storefront for a live shop. Returns the shop's branding plus
 * products the admin enabled in Shop Catalog. Only `live` shops are exposed.
 * An empty selection yields an empty product list.
 */
export async function getStorefront(shopId) {
  const shop = await Shop.findById(shopId).setOptions({ skipTenantGuard: true });
  if (!shop || shop.status !== 'live') throw new NotFoundError('Shop not found');

  const selectedIds = (shop.selectedCatalogProductIds || []).map(String);

  const collections = await Collection.find({
    ...collectionsForShopFilter(shop._id),
    tenantId: shop.tenantId,
    status: { $ne: 'archived' },
  })
    .setOptions({ skipTenantGuard: true })
    .select('productRefs artworkUrl preferredColors')
    .lean();

  const collectionCatalogIds = [];
  for (const col of collections) {
    for (const ref of col.productRefs || []) {
      if (ref.catalogProductId) collectionCatalogIds.push(String(ref.catalogProductId));
    }
  }
  const effectiveIds = [...new Set([...selectedIds, ...collectionCatalogIds])];
  if (!effectiveIds.length) {
    return {
      shop: {
        id: String(shop._id),
        name: shop.name,
        logoUrl: shop.logoUrl || '',
        bannerTheme: shop.bannerConfig?.theme || 'light',
        bannerPreset: shop.bannerConfig?.preset || '',
        currencyMode: shop.currencyMode,
      },
      products: [],
    };
  }

  const selectedSet = new Set(effectiveIds);

  const catalogRows = await CatalogProduct.find({
    status: 'active',
    _id: { $in: effectiveIds },
  })
    .setOptions({ skipTenantGuard: true })
    .select(CATALOG_SELECT)
    .lean();

  const catalogById = new Map(catalogRows.map((row) => [String(row._id), row]));

  const products = [];
  const covered = new Set();

  for (const col of collections) {
    for (const ref of col.productRefs || []) {
      const catalogProductId = ref.catalogProductId ? String(ref.catalogProductId) : '';
      if (!catalogProductId || !selectedSet.has(catalogProductId)) continue;
      const base = catalogById.get(catalogProductId);
      if (!base) continue;
      covered.add(catalogProductId);
      products.push(mapBrandedListing(col, ref, base));
    }
  }

  for (const id of effectiveIds) {
    if (covered.has(id)) continue;
    const base = catalogById.get(id);
    if (!base) continue;
    products.push(mapPlainListing(base));
  }

  products.sort((a, b) => String(a.name).localeCompare(String(b.name)));

  return {
    shop: {
      id: String(shop._id),
      name: shop.name,
      logoUrl: shop.logoUrl || '',
      bannerTheme: shop.bannerConfig?.theme || 'light',
      bannerPreset: shop.bannerConfig?.preset || '',
      currencyMode: shop.currencyMode,
    },
    products,
  };
}
