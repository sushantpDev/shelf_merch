/** Premium packaging charge per recipient (INR). */
export const PREMIUM_BOX_PER_RECIP = 49;
const SERVICE_FEE_RATE = 0.12;
const SHIP_PER_RECIP = 120;
const GST_RATE = 0.18;

export type KitSendTotals = {
  qty: number;
  /** Kit unit price (sum of product basePriceInr). */
  unitPrice: number;
  /** Total kit cost = unitPrice × recipients. */
  sub: number;
  pkgCost: number;
  fee: number;
  ship: number;
  tax: number;
  total: number;
};

/** Sum of catalog basePriceInr for selected kit products (qty 1 each). */
export function sumKitProductPrices(
  products: Array<{ basePriceInr?: number | null }>,
): number {
  return products.reduce((sum, p) => sum + Math.round(Number(p.basePriceInr) || 0), 0);
}

/**
 * Money math for a kit send:
 * kit unit (from products) × recipients, premium box ₹49/recipient, 12% service fee,
 * ₹120/recipient shipping, then 18% GST on the running total (including packaging).
 */
export function kitSendTotals(
  recipientCount: number,
  packaging: "none" | "box",
  kitUnitPriceInr: number,
): KitSendTotals {
  const qty = Math.max(0, recipientCount);
  const unitPrice = Math.max(0, Math.round(kitUnitPriceInr));
  const sub = unitPrice * qty;
  const pkgCost = (packaging === "box" ? PREMIUM_BOX_PER_RECIP : 0) * qty;
  const fee = sub * SERVICE_FEE_RATE;
  const ship = SHIP_PER_RECIP * qty;
  const tax = (sub + fee + pkgCost + ship) * GST_RATE;
  const total = sub + fee + pkgCost + ship + tax;
  return { qty, unitPrice, sub, pkgCost, fee, ship, tax, total };
}

/** 1 point = ₹2. */
export const POINT_VALUE = 2;
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
 * Money math for a points send. Mirrors the legacy `sendPoints` checkout:
 * budget per recipient (INR) → points at ₹2/pt, 15% service fee, 18% GST.
 */
export function pointsSendTotals(
  budgetPerRecipient: number,
  recipientCount: number,
): PointsSendTotals {
  const sub = budgetPerRecipient * recipientCount;
  const fee = sub * POINTS_SERVICE_FEE_RATE;
  const tax = (sub + fee) * GST_RATE;
  const total = sub + fee + tax;
  return {
    pointsPerRecipient: budgetPerRecipient / POINT_VALUE,
    totalPoints: (budgetPerRecipient / POINT_VALUE) * recipientCount,
    sub,
    fee,
    tax,
    total,
  };
}
