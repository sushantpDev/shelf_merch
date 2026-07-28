/** GST-inclusive catalog price → ex-GST rate (rounded to nearest integer). */
export function priceWithoutGst(priceWithGst, profile) {
  const incl = Math.round(Number(priceWithGst) || 0);
  if (!incl) return 0;
  const rate = profile === 'apparel' ? 0.05 : 0.18;
  return Math.round(incl - incl * rate);
}

export function gstProfileForCategory(category) {
  return String(category || '').toLowerCase() === 'apparel' ? 'apparel' : 'other';
}

/** CGST/SGST rates for a line profile. */
export function gstRatesForProfile(profile) {
  if (profile === 'apparel') return { cgst: 2.5, sgst: 2.5 };
  return { cgst: 9, sgst: 9 };
}

export function lineTaxAmounts(taxable, profile) {
  const { cgst, sgst } = gstRatesForProfile(profile);
  const cgstAmt = Math.round((taxable * cgst) / 100 * 100) / 100;
  const sgstAmt = Math.round((taxable * sgst) / 100 * 100) / 100;
  return { cgstRate: cgst, sgstRate: sgst, cgstAmt, sgstAmt, totalTax: cgstAmt + sgstAmt };
}

export function formatHsn(hsn) {
  const v = String(hsn || '').trim();
  return v || '-';
}
