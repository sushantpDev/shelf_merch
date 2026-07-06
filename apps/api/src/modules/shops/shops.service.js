import { Shop } from './shop.model.js';
import { ApiError, NotFoundError } from '../../utils/errors.js';
import { ensureUniqueShopSlug, slugifyShopName } from '../../utils/shopSlug.js';

async function backfillShopSlug(shop) {
  if (shop.slug?.trim()) return shop;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      shop.slug = await ensureUniqueShopSlug(Shop, shop.name, shop._id);
      await shop.save();
      return shop;
    } catch (err) {
      if (err?.code === 11000 && attempt < 4) continue;
      throw err;
    }
  }
  return shop;
}

export async function listShops({ tenantId }) {
  const shops = await Shop.find({ tenantId }).sort({ createdAt: -1 });
  for (const shop of shops) {
    if (!shop.slug?.trim()) await backfillShopSlug(shop);
  }
  return Shop.find({ tenantId }).sort({ createdAt: -1 });
}

export async function getShop({ tenantId, shopId }) {
  const shop = await Shop.findOne({ _id: shopId, tenantId });
  if (!shop) throw new NotFoundError('Shop not found');
  return backfillShopSlug(shop);
}

export async function getShopBySlug(slug) {
  const shop = await Shop.findOne({ slug: slugifyShopName(slug), status: 'live' }).setOptions({
    skipTenantGuard: true,
  });
  if (!shop) throw new NotFoundError('Shop not found');
  return shop;
}

export async function createShop({ tenantId, data }) {
  const slug = await ensureUniqueShopSlug(Shop, data.slug || data.name);
  return Shop.create({ tenantId, ...data, slug });
}

export async function updateShop({ tenantId, shopId, patch }) {
  const shop = await getShop({ tenantId, shopId });
  const before = shop.toObject();
  const { status: _ignored, slug: slugPatch, ...rest } = patch; // publish endpoint owns status
  Object.assign(shop, rest);
  if (slugPatch != null && String(slugPatch).trim()) {
    shop.slug = await ensureUniqueShopSlug(Shop, slugPatch, shop._id);
  } else if (!shop.slug?.trim()) {
    shop.slug = await ensureUniqueShopSlug(Shop, shop.name, shop._id);
  }
  await shop.save();
  return { before, shop };
}

/** §7.6 — publish requires at least one category. */
export async function publishShop({ tenantId, shopId }) {
  const shop = await getShop({ tenantId, shopId });
  if (!shop.categories.length) {
    throw new ApiError(422, 'Add at least one category before publishing', 'SHOP_NO_CATEGORIES');
  }
  shop.status = 'live';
  await shop.save();
  return shop;
}

export async function archiveShop({ tenantId, shopId }) {
  const shop = await getShop({ tenantId, shopId });
  await shop.softDelete();
  return shop;
}
