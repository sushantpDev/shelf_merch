import { Shop } from './shop.model.js';
import { ApiError, NotFoundError } from '../../utils/errors.js';

export async function listShops({ tenantId }) {
  return Shop.find({ tenantId }).sort({ createdAt: -1 });
}

export async function getShop({ tenantId, shopId }) {
  const shop = await Shop.findOne({ _id: shopId, tenantId });
  if (!shop) throw new NotFoundError('Shop not found');
  return shop;
}

export async function createShop({ tenantId, data }) {
  return Shop.create({ tenantId, ...data });
}

export async function updateShop({ tenantId, shopId, patch }) {
  const shop = await getShop({ tenantId, shopId });
  const before = shop.toObject();
  const { status: _ignored, ...rest } = patch; // publish endpoint owns status
  Object.assign(shop, rest);
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
