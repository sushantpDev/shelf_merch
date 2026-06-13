import mongoose from 'mongoose';

export const PRODUCT_STATUSES = ['draft', 'active', 'archived', 'discontinued'];
export const INVENTORY_MODES = ['physical', 'made_to_order'];
export const CUSTOMIZATION_METHODS = [
  'screen_print',
  'dtf',
  'embroidery',
  'engraving',
  'sublimation',
  'uv_print',
];

/**
 * Internal-only fields (cost, supplier) are `select: false` so they can never
 * leak into tenant/public responses by accident (non-negotiable #3). Platform
 * services opt in with `.select(INTERNAL_PRODUCT_FIELDS)`.
 */
export const INTERNAL_PRODUCT_FIELDS = '+costPriceInr +supplierName';

// Platform-wide master catalog — intentionally NOT tenant-scoped (§5.3).
const catalogProductSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true },
    skuPrefix: { type: String, default: '' },
    slug: { type: String, default: '', index: true },
    brand: { type: String, default: '' },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, required: true, index: true },
    group: { type: String, default: '' }, // icon group, e.g. "tee", "mug", "hoodie"
    // basePriceInr is the tenant-facing selling price (kept as the historical
    // field name; the platform API exposes it as sellingPriceInr).
    basePriceInr: { type: Number, required: true },
    costPriceInr: { type: Number, default: 0, select: false },
    supplierName: { type: String, default: '', select: false },
    gstRate: { type: Number, default: 18 },
    hsnCode: { type: String, default: '' },
    moq: { type: Number, default: 1 },
    material: { type: String, default: '' },
    printableAreas: { type: [String], default: [] },
    customizationMethods: { type: [String], default: [] },
    productionDays: { type: Number, default: 7 },
    customization: [
      {
        method: { type: String, enum: CUSTOMIZATION_METHODS, required: true },
        printableArea: { type: String, default: '' },
        extraCostInr: { type: Number, default: 0 },
      },
    ],
    variants: [
      {
        color: String,
        size: String,
        material: String,
        sku: String,
        priceOverrideInr: { type: Number, default: null },
        stock: { type: Number, default: 0 },
      },
    ],
    imageUrls: { type: [String], default: [] },
    primaryImageUrl: { type: String, default: '' },
    // §3.2 — available/reserved are derived from InventoryTransactions only.
    inventory: {
      mode: { type: String, enum: INVENTORY_MODES, default: 'physical' },
      available: { type: Number, default: 0 },
      reserved: { type: Number, default: 0 },
      lowStockThreshold: { type: Number, default: 10 },
    },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
    status: { type: String, enum: PRODUCT_STATUSES, default: 'active' },
  },
  { timestamps: true },
);

catalogProductSchema.index({ status: 1, category: 1 });

export const CatalogProduct = mongoose.model('CatalogProduct', catalogProductSchema);
