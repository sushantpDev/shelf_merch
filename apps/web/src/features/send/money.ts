/** Per-recipient unit price for a kit send, in INR. */
export const KIT_UNIT_PRICE = 4200;
const PREMIUM_BOX_PER_RECIP = 49;
const SERVICE_FEE_RATE = 0.12;
const SHIP_PER_RECIP = 120;
const GST_RATE = 0.18;

export type KitSendTotals = {
  qty: number;
  sub: number;
  pkgCost: number;
  fee: number;
  ship: number;
  tax: number;
  total: number;
};

/**
 * Money math for a kit send. Mirrors the legacy `sendItems` checkout:
 * unit ₹4200 × recipients, premium box ₹49/recipient, 12% service fee,
 * ₹120/recipient shipping, then 18% GST on the running total.
 */
export function kitSendTotals(recipientCount: number, packaging: "none" | "box"): KitSendTotals {
  const qty = recipientCount;
  const sub = KIT_UNIT_PRICE * qty;
  const pkgCost = (packaging === "box" ? PREMIUM_BOX_PER_RECIP : 0) * qty;
  const fee = sub * SERVICE_FEE_RATE;
  const ship = SHIP_PER_RECIP * qty;
  const tax = (sub + fee + pkgCost + ship) * GST_RATE;
  const total = sub + fee + pkgCost + ship + tax;
  return { qty, sub, pkgCost, fee, ship, tax, total };
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
