/**
 * Whether a collection is assigned to a shop.
 * shopIds is the source of truth; shopId alone only applies when shopIds is empty (legacy).
 */
export function isCollectionLinkedToShop(collection, shopId) {
  const sid = String(shopId);
  const linked = (collection?.shopIds || []).map(String);
  if (linked.length) return linked.includes(sid);
  return collection?.shopId ? String(collection.shopId) === sid : false;
}

/** Mongo filter: collections explicitly assigned to a shop. */
export function collectionsForShopFilter(shopId) {
  return {
    $or: [
      { shopIds: shopId },
      {
        $and: [
          { $or: [{ shopIds: { $size: 0 } }, { shopIds: { $exists: false } }] },
          { shopId },
        ],
      },
    ],
  };
}
