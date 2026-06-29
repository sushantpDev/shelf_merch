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
