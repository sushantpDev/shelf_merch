/** Premium packaging charge per recipient (INR). */
export const PREMIUM_BOX_PER_RECIP = 49;
const SERVICE_FEE_RATE = 0.12;
const SHIP_PER_RECIP = 120;
const GST_RATE = 0.18;

export type KitSendTotals = {
  qty: number;
  /** Sum of product basePriceInr (one kit). */
  unitPrice: number;
  /** Packaging per kit (₹49 premium box or 0). */
  pkgPerKit: number;
  /** Products + packaging per kit. */
  costPerKit: number;
  /** Subtotal = costPerKit × recipients. */
  sub: number;
  /** @deprecated Included in costPerKit/sub — kept for compatibility. */
  pkgCost: number;
  /** @deprecated Not charged in checkout summary. */
  fee: number;
  /** @deprecated Shown as free in checkout summary. */
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
 * cost per kit = product prices + packaging per kit;
 * subtotal = cost per kit × recipients;
 * GST = 18% of subtotal; shipping and service fee excluded for now.
 */
export function kitSendTotals(
  recipientCount: number,
  packaging: "none" | "box",
  kitUnitPriceInr: number,
): KitSendTotals {
  const qty = Math.max(0, recipientCount);
  const unitPrice = Math.max(0, Math.round(kitUnitPriceInr));
  const pkgPerKit = packaging === "box" ? PREMIUM_BOX_PER_RECIP : 0;
  const costPerKit = unitPrice + pkgPerKit;
  const sub = costPerKit * qty;
  const tax = sub * GST_RATE;
  const total = sub + tax;
  return {
    qty,
    unitPrice,
    pkgPerKit,
    costPerKit,
    sub,
    pkgCost: pkgPerKit * qty,
    fee: 0,
    ship: 0,
    tax,
    total,
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
