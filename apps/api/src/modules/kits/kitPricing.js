/**
 * Shared kit send money math — must stay in sync with
 * apps/web/src/features/send/money.ts.
 */
export const PREMIUM_BOX_PER_RECIP = 49;
const SERVICE_FEE_RATE = 0.12;
const SHIP_PER_RECIP = 120;
const GST_RATE = 0.18;
const APPAREL_GST_RATE = 0.05;

/** Sum of catalog basePriceInr for selected kit products (qty 1 each). Curated / publish. */
export function sumKitProductPrices(products = []) {
  return products.reduce((sum, p) => sum + Math.round(Number(p?.basePriceInr) || 0), 0);
}

/** Product-level GST rate from category. Apparel = 5%, everything else = 18%. */
export function productGstRate(category) {
  return String(category || '').trim().toLowerCase() === 'apparel'
    ? APPAREL_GST_RATE
    : GST_RATE;
}

/**
 * Strip GST from a GST-inclusive basePriceInr, then round UP.
 * Apparel: ceil(price - price × 0.05); other: ceil(price - price × 0.18).
 */
export function netPriceExGst(basePriceInr, category) {
  const inclusive = Math.max(0, Number(basePriceInr) || 0);
  const rate = productGstRate(category);
  return Math.ceil(inclusive - inclusive * rate);
}

/** Kit GST is 5% only when every product is Apparel; otherwise 18%. */
export function customisedKitGstRate(products = []) {
  if (!products.length) return GST_RATE;
  return products.every((p) => productGstRate(p?.category) === APPAREL_GST_RATE)
    ? APPAREL_GST_RATE
    : GST_RATE;
}

/** Sum of net (ex-GST, ceil) product prices for a customised kit. */
export function sumCustomisedKitNetPrices(products = []) {
  return products.reduce(
    (sum, p) => sum + netPriceExGst(Number(p?.basePriceInr) || 0, p?.category),
    0,
  );
}

/**
 * Curated kit checkout — approxValueInr is GST-inclusive (18%).
 */
export function curatedKitSendTotals(recipientCount, pricePerKitInr) {
  const qty = Math.max(0, Number(recipientCount) || 0);
  const costPerKit = Math.max(0, Math.round(Number(pricePerKitInr) || 0));
  const total = costPerKit * qty;
  const tax = Math.ceil(total - total / (1 + GST_RATE));
  return {
    qty,
    unitPrice: costPerKit,
    pkgPerKit: 0,
    costPerKit,
    sub: total,
    pkgCost: 0,
    fee: 0,
    ship: 0,
    tax,
    total,
    kitGstRate: GST_RATE,
  };
}

/**
 * Legacy kit send math — unit price treated as ex-GST.
 * Prefer curatedKitSendTotals for platform curated kits (approxValueInr).
 */
export function kitSendTotals(recipientCount, packaging, kitUnitPriceInr) {
  const qty = Math.max(0, Number(recipientCount) || 0);
  const unitPrice = Math.max(0, Math.round(Number(kitUnitPriceInr) || 0));
  const pkgPerKit = packaging === 'box' ? PREMIUM_BOX_PER_RECIP : 0;
  const costPerKitExGst = unitPrice + pkgPerKit;
  // Price per kit is GST-inclusive; grand total = recipients × inclusive price.
  const costPerKit = Math.round(costPerKitExGst * (1 + GST_RATE));
  const total = costPerKit * qty;
  const tax = total - costPerKitExGst * qty;
  return {
    qty,
    unitPrice,
    pkgPerKit,
    costPerKit,
    sub: total,
    pkgCost: pkgPerKit * qty,
    fee: 0,
    ship: 0,
    tax,
    total,
  };
}

/**
 * Customised Kit checkout math — must stay in sync with money.ts customisedKitSendTotals().
 */
export function customisedKitSendTotals(recipientCount, packaging, products = []) {
  const qty = Math.max(0, Number(recipientCount) || 0);
  const itemsSubtotal = sumCustomisedKitNetPrices(products);
  const pkgPerKit = packaging === 'box' ? PREMIUM_BOX_PER_RECIP : 0;
  const taxablePerKit = itemsSubtotal + pkgPerKit;
  const kitGstRate = customisedKitGstRate(products);
  const taxPerKit = Math.ceil(taxablePerKit * kitGstRate);
  const costPerKit = taxablePerKit + taxPerKit;
  const total = costPerKit * qty;
  return {
    qty,
    unitPrice: itemsSubtotal,
    pkgPerKit,
    costPerKit,
    sub: taxablePerKit * qty,
    pkgCost: pkgPerKit * qty,
    fee: 0,
    ship: 0,
    tax: taxPerKit * qty,
    total,
    itemsSubtotal,
    kitGstRate,
    taxablePerKit,
  };
}
