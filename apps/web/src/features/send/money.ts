/** Premium packaging charge per recipient (INR). */
export const PREMIUM_BOX_PER_RECIP = 49;
const SERVICE_FEE_RATE = 0.12;
const SHIP_PER_RECIP = 120;
const GST_RATE = 0.18;

export type KitSendTotals = {
  qty: number;
  /** Sum of product basePriceInr (one kit), before GST. */
  unitPrice: number;
  /** Packaging per kit (₹49 premium box or 0). */
  pkgPerKit: number;
  /** Products + packaging + 18% GST — the charged price per kit. */
  costPerKit: number;
  /** Same as total: costPerKit × recipients (GST already in costPerKit). */
  sub: number;
  /** @deprecated Included in costPerKit/sub — kept for compatibility. */
  pkgCost: number;
  /** @deprecated Not charged in checkout summary. */
  fee: number;
  /** @deprecated Shown as free in checkout summary. */
  ship: number;
  /** GST portion embedded in the inclusive kit price (not added separately). */
  tax: number;
  total: number;
  /** Customised kits only — see CustomisedKitSendTotals. */
  itemsSubtotal?: number;
  kitGstRate?: number;
  taxablePerKit?: number;
};

/** Sum of catalog basePriceInr for selected kit products (qty 1 each). */
export function sumKitProductPrices(
  products: Array<{ basePriceInr?: number | null }>,
): number {
  return products.reduce((sum, p) => sum + Math.round(Number(p.basePriceInr) || 0), 0);
}

/**
 * Money math for a kit send (Curated Kits — unchanged):
 * ex-GST kit = products + packaging;
 * price per kit = ex-GST × 1.18 (GST inclusive);
 * grand total = recipients × GST-inclusive price per kit.
 * Shipping and service fee excluded for now.
 */
export function kitSendTotals(
  recipientCount: number,
  packaging: "none" | "box",
  kitUnitPriceInr: number,
): KitSendTotals {
  const qty = Math.max(0, recipientCount);
  const unitPrice = Math.max(0, Math.round(kitUnitPriceInr));
  const pkgPerKit = packaging === "box" ? PREMIUM_BOX_PER_RECIP : 0;
  const costPerKitExGst = unitPrice + pkgPerKit;
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

type PricedCatalogProduct = {
  basePriceInr?: number | null;
  category?: string | null;
};

/** Product GST rate from catalog category. Apparel = 5%, everything else = 18%. */
export function productGstRate(category?: string | null): number {
  return String(category || "").trim().toLowerCase() === "apparel" ? 0.05 : 0.18;
}

/**
 * Derive GST-exclusive net price from GST-inclusive basePriceInr.
 * Formula: ceil(inclusive − inclusive × rate). Always round up.
 */
export function netPriceExGst(
  basePriceInr: number,
  category?: string | null,
): number {
  const inclusive = Math.max(0, Number(basePriceInr) || 0);
  const rate = productGstRate(category);
  return Math.ceil(inclusive - inclusive * rate);
}

/** Sum of net (ex-GST) product prices for one customised kit. */
export function sumCustomisedKitNetPrices(products: PricedCatalogProduct[]): number {
  return products.reduce(
    (sum, p) => sum + netPriceExGst(Number(p.basePriceInr) || 0, p.category),
    0,
  );
}

/**
 * Kit-level GST for customised kits:
 * 5% only when every product is Apparel; otherwise 18%.
 */
export function customisedKitGstRate(products: PricedCatalogProduct[]): number {
  if (!products.length) return GST_RATE;
  return products.every((p) => productGstRate(p.category) === 0.05) ? 0.05 : GST_RATE;
}

export type CustomisedKitSendTotals = KitSendTotals & {
  /** Net product prices (ex-GST), one kit. */
  itemsSubtotal: number;
  /** Kit GST rate applied to (items + packaging): 0.05 or 0.18. */
  kitGstRate: number;
  /** Items + packaging per kit (taxable base before kit GST). */
  taxablePerKit: number;
};

/**
 * Customised Kit checkout math only.
 * basePriceInr is GST-inclusive; strip product GST by category, add packaging,
 * then apply kit GST on (items + packaging).
 */
export function customisedKitSendTotals(
  recipientCount: number,
  packaging: "none" | "box",
  products: PricedCatalogProduct[],
): CustomisedKitSendTotals {
  const qty = Math.max(0, recipientCount);
  const itemsSubtotal = sumCustomisedKitNetPrices(products);
  const pkgPerKit = packaging === "box" ? PREMIUM_BOX_PER_RECIP : 0;
  const taxablePerKit = itemsSubtotal + pkgPerKit;
  const kitGstRate = customisedKitGstRate(products);
  const taxPerKit = Math.ceil(taxablePerKit * kitGstRate);
  const costPerKit = taxablePerKit + taxPerKit;
  const total = costPerKit * qty;
  const tax = taxPerKit * qty;
  return {
    qty,
    unitPrice: itemsSubtotal,
    pkgPerKit,
    costPerKit,
    sub: taxablePerKit * qty,
    pkgCost: pkgPerKit * qty,
    fee: 0,
    ship: 0,
    tax,
    total,
    itemsSubtotal,
    kitGstRate,
    taxablePerKit,
  };
}

import { POINTS_PER_RUPEE } from "@/lib/storeCurrency";
const POINTS_SERVICE_FEE_RATE = 0.15;

export type PointsSendTotals = {
  pointsPerRecipient: number;
  totalPoints: number;
  sub: number;
  fee: number;
  tax: number;
  total: number;
};

/**
 * Money math for a points send: budget per recipient (INR) → points at ₹1 = 2 Pts,
 * 15% service fee, 18% GST.
 */
export function pointsSendTotals(
  budgetPerRecipient: number,
  recipientCount: number,
): PointsSendTotals {
  const sub = budgetPerRecipient * recipientCount;
  const fee = sub * POINTS_SERVICE_FEE_RATE;
  const tax = (sub + fee) * GST_RATE;
  const total = sub + fee + tax;
  const pointsPerRecipient = budgetPerRecipient * POINTS_PER_RUPEE;
  return {
    pointsPerRecipient,
    totalPoints: pointsPerRecipient * recipientCount,
    sub,
    fee,
    tax,
    total,
  };
}

/** @deprecated Use POINTS_PER_RUPEE from storeCurrency — ₹1 = 2 points. */
export const POINT_VALUE = POINTS_PER_RUPEE;
