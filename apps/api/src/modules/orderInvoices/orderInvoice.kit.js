import { CatalogProduct } from '../catalog/catalogProduct.model.js';

const KIT_PRODUCT_SELECT = 'name basePriceInr category hsnCode';

/** Active catalog rows for a kit — used for invoice line pricing only. */
export async function loadActiveKitEntriesForInvoice(kit) {
  const productIds = kit.productRefs.map((r) => r.catalogProductId).filter(Boolean);
  if (!productIds.length) return [];
  const products = await CatalogProduct.find({ _id: { $in: productIds }, status: 'active' })
    .select(KIT_PRODUCT_SELECT)
    .lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const entries = [];
  const seen = new Set();
  for (const ref of kit.productRefs) {
    const id = String(ref.catalogProductId || '');
    if (!id || seen.has(id)) continue;
    const product = byId.get(id);
    if (!product) continue;
    seen.add(id);
    entries.push({ ref, product });
  }
  return entries;
}
