/** Branded storefront listing id: collection × catalog product. */
export function listingKey(collectionId, catalogProductId) {
  return `${String(collectionId)}:${String(catalogProductId)}`;
}

export function parseListingKey(key) {
  const parts = String(key ?? '').split(':');
  if (parts.length === 2 && parts.every((p) => /^[a-f\d]{24}$/i.test(p))) {
    return { collectionId: parts[0], catalogProductId: parts[1] };
  }
  return null;
}

export function listingKeysFromCollection(collection) {
  const collectionId = String(collection._id);
  return (collection.productRefs || [])
    .filter((ref) => ref.catalogProductId)
    .map((ref) => listingKey(collectionId, ref.catalogProductId));
}

export function listingKeysForCollection(collectionId, catalogProductIds) {
  return catalogProductIds.map((id) => listingKey(collectionId, id));
}
