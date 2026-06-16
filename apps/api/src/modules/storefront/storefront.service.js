import { Shop } from '../shops/shop.model.js';
import { Collection } from '../collections/collection.model.js';
import { CatalogProduct } from '../catalog/catalogProduct.model.js';
import { NotFoundError } from '../../utils/errors.js';

/**
 * Public, no-auth storefront for a live shop. Returns the shop's branding plus
 * the products curated into its (non-archived) collections — mirroring the
 * redemption store curation in redemptions.service.js#getCatalog. Only `live`
 * shops are exposed; drafts 404 so they stay private.
 */
export async function getStorefront(shopId) {
  const shop = await Shop.findById(shopId).setOptions({ skipTenantGuard: true });
  if (!shop || shop.status !== 'live') throw new NotFoundError('Shop not found');

  const collections = await Collection.find({
    shopId: shop._id,
    tenantId: shop.tenantId,
    status: { $ne: 'archived' },
  })
    .setOptions({ skipTenantGuard: true })
    .select('productRefs artworkUrl preferredColors')
    .lean();
  const ids = collections
    .flatMap((c) => (c.productRefs || []).map((r) => r.catalogProductId))
    .filter(Boolean);

  const artworkByProductId = new Map();
  const preferredColorsByProductId = new Map();
  for (const col of collections) {
    for (const ref of col.productRefs || []) {
      const pid = ref.catalogProductId ? String(ref.catalogProductId) : '';
      if (!pid) continue;
      if (col.artworkUrl && !artworkByProductId.has(pid)) artworkByProductId.set(pid, col.artworkUrl);
      if (col.preferredColors?.length && !preferredColorsByProductId.has(pid)) {
        preferredColorsByProductId.set(pid, col.preferredColors);
      }
    }
  }

  const filter = { status: 'active' };
  // Fall back to the full active catalog when the shop has no curated products
  // yet, so "View shop" is never an empty page.
  if (ids.length) filter._id = { $in: ids };
  const products = await CatalogProduct.find(filter)
    .setOptions({ skipTenantGuard: true })
    .select('name brand group category description basePriceInr primaryImageUrl imageUrls maskImageUrl baseImageUrl variants printAreas')
    .sort({ name: 1 })
    .lean()
    .then((rows) =>
      rows.map((p) => ({
        ...p,
        artworkUrl: artworkByProductId.get(String(p._id)) || '',
        preferredColors: preferredColorsByProductId.get(String(p._id)) || [],
      })),
    );

  return {
    shop: {
      id: String(shop._id),
      name: shop.name,
      logoUrl: shop.logoUrl || '',
      bannerTheme: shop.bannerConfig?.theme || 'light',
      currencyMode: shop.currencyMode,
    },
    products,
  };
}
