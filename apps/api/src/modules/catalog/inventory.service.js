import { CatalogProduct, INTERNAL_PRODUCT_FIELDS } from './catalogProduct.model.js';
import { InventoryTransaction } from './inventoryTransaction.model.js';
import { ApiError, NotFoundError } from '../../utils/errors.js';
import { getPagination, paginatedResponse } from '../../utils/pagination.js';

/**
 * §3.2 — THE ONLY way stock moves. Mirrors ledger.service: every movement is
 * an append-only InventoryTransaction; product.inventory.available/reserved
 * are derived caches updated here and nowhere else.
 *
 *   add      → available += qty
 *   reduce   → available -= qty
 *   reserve  → available -= qty, reserved += qty   (campaign launch)
 *   release  → available += qty, reserved -= qty   (campaign cancel)
 *   adjust   → available += qty (signed correction)
 *
 * Consumption on redemption = `reduce` against `reserved` (qty negative on
 * reserved): handled via { consumeReserved: true }.
 */
export async function applyInventoryTransaction({
  productId,
  variantSku = '',
  type,
  qty,
  reason,
  relatedCampaignId = null,
  relatedOrderId = null,
  performedBy = null,
  consumeReserved = false,
}) {
  if (!Number.isFinite(qty) || qty <= 0) {
    if (!(type === 'adjust' && Number.isFinite(qty) && qty !== 0)) {
      throw new ApiError(422, 'qty must be a positive number (adjust allows signed)', 'INVALID_QTY');
    }
  }

  const product = await CatalogProduct.findById(productId).select(INTERNAL_PRODUCT_FIELDS);
  if (!product) throw new NotFoundError('Product not found');

  if (product.inventory.mode === 'made_to_order' && type !== 'adjust') {
    throw new ApiError(
      422,
      'Made-to-order products do not track stock — switch mode to physical first',
      'MADE_TO_ORDER',
    );
  }

  let { available, reserved } = product.inventory;

  switch (type) {
    case 'add':
      available += qty;
      break;
    case 'reduce':
      if (consumeReserved) {
        if (reserved < qty) throw new ApiError(422, 'Not enough reserved stock', 'INSUFFICIENT_STOCK');
        reserved -= qty;
      } else {
        if (available < qty) throw new ApiError(422, 'Not enough available stock', 'INSUFFICIENT_STOCK');
        available -= qty;
      }
      break;
    case 'reserve':
      if (available < qty) throw new ApiError(422, 'Not enough available stock to reserve', 'INSUFFICIENT_STOCK');
      available -= qty;
      reserved += qty;
      break;
    case 'release':
      if (reserved < qty) throw new ApiError(422, 'Cannot release more than is reserved', 'INVALID_RELEASE');
      available += qty;
      reserved -= qty;
      break;
    case 'adjust':
      available += qty;
      if (available < 0) throw new ApiError(422, 'Adjustment would make stock negative', 'INVALID_ADJUSTMENT');
      break;
    default:
      throw new ApiError(422, `Unknown inventory transaction type "${type}"`, 'INVALID_TYPE');
  }

  const txn = await InventoryTransaction.create({
    productId,
    variantSku,
    type,
    qty,
    availableAfter: available,
    reservedAfter: reserved,
    reason,
    relatedCampaignId,
    relatedOrderId,
    performedBy,
  });

  product.inventory.available = available;
  product.inventory.reserved = reserved;
  await product.save();

  return { transaction: txn, inventory: product.inventory };
}

export async function setInventoryMode(productId, { mode, lowStockThreshold }) {
  const product = await CatalogProduct.findById(productId);
  if (!product) throw new NotFoundError('Product not found');
  if (mode) product.inventory.mode = mode;
  if (lowStockThreshold !== undefined) product.inventory.lowStockThreshold = lowStockThreshold;
  await product.save();
  return product.inventory;
}

function stockStatus(inv) {
  if (inv.mode === 'made_to_order') return 'made_to_order';
  if (inv.available <= 0) return 'out_of_stock';
  if (inv.available <= inv.lowStockThreshold) return 'low_stock';
  return 'in_stock';
}

export async function listInventory({ query }) {
  const { page, limit, skip } = getPagination(query, { defaultLimit: 50 });
  const filter = {
    status: { $ne: 'archived' },
    ...(query.mode ? { 'inventory.mode': query.mode } : {}),
    ...(query.search ? { name: { $regex: query.search, $options: 'i' } } : {}),
  };
  const [items, total] = await Promise.all([
    CatalogProduct.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    CatalogProduct.countDocuments(filter),
  ]);

  const rows = items
    .map((p) => ({
      productId: p._id,
      name: p.name,
      sku: p.sku,
      mode: p.inventory?.mode ?? 'physical',
      available: p.inventory?.available ?? 0,
      reserved: p.inventory?.reserved ?? 0,
      lowStockThreshold: p.inventory?.lowStockThreshold ?? 0,
      stockStatus: stockStatus(p.inventory ?? { mode: 'physical', available: 0, lowStockThreshold: 0 }),
    }))
    .filter((row) => (query.stockStatus ? row.stockStatus === query.stockStatus : true));

  return paginatedResponse(rows, total, { page, limit });
}

export async function listInventoryTransactions(productId, query) {
  const { page, limit, skip } = getPagination(query);
  const [items, total] = await Promise.all([
    InventoryTransaction.find({ productId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    InventoryTransaction.countDocuments({ productId }),
  ]);
  return paginatedResponse(items, total, { page, limit });
}
