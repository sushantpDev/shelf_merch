/**
 * Shared kit send money math — must stay in sync with
 * apps/web/src/features/send/money.ts kitSendTotals().
 */
export const PREMIUM_BOX_PER_RECIP = 49;
const SERVICE_FEE_RATE = 0.12;
const SHIP_PER_RECIP = 120;
const GST_RATE = 0.18;

export function sumKitProductPrices(products = []) {
  return products.reduce((sum, p) => sum + Math.round(Number(p?.basePriceInr) || 0), 0);
}

export function kitSendTotals(recipientCount, packaging, kitUnitPriceInr) {
  const qty = Math.max(0, Number(recipientCount) || 0);
  const unitPrice = Math.max(0, Math.round(Number(kitUnitPriceInr) || 0));
  const pkgPerKit = packaging === 'box' ? PREMIUM_BOX_PER_RECIP : 0;
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
