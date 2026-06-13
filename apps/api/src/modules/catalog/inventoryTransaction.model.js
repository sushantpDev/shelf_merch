import mongoose from 'mongoose';

export const INVENTORY_TXN_TYPES = ['add', 'reduce', 'reserve', 'release', 'adjust'];

/**
 * §3.2 — append-only inventory ledger (mirror of the wallet ledger).
 * `available`/`reserved` on the product are derived caches; they are never
 * edited directly, only through applyInventoryTransaction().
 */
const inventoryTransactionSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CatalogProduct',
      required: true,
      index: true,
    },
    variantSku: { type: String, default: '' },
    type: { type: String, enum: INVENTORY_TXN_TYPES, required: true },
    qty: { type: Number, required: true },
    availableAfter: { type: Number, required: true },
    reservedAfter: { type: Number, required: true },
    reason: { type: String, required: true },
    relatedCampaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
    relatedOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

inventoryTransactionSchema.index({ productId: 1, createdAt: -1 });

export const InventoryTransaction = mongoose.model(
  'InventoryTransaction',
  inventoryTransactionSchema,
);
