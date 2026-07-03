import mongoose from 'mongoose';
import { Shop } from './shop.model.js';

/** Ensure catalog products from a shop collection appear on the live storefront. */
export async function addCatalogProductsToShop(shopId, tenantId, catalogProductIds) {
  const ids = [...new Set(catalogProductIds.map(String).filter(Boolean))];
  if (!ids.length) return;

  const shop = await Shop.findOne({ _id: shopId, tenantId });
  if (!shop) return;

  const existing = new Set((shop.selectedCatalogProductIds || []).map(String));
  const toAdd = ids.filter((id) => !existing.has(id));
  if (!toAdd.length) return;

  shop.selectedCatalogProductIds = [
    ...(shop.selectedCatalogProductIds || []),
    ...toAdd.map((id) => new mongoose.Types.ObjectId(id)),
  ];
  await shop.save();
}
