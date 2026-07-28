import { CatalogProduct } from '../catalog/catalogProduct.model.js';
import { sumKitProductPrices } from '../kits/kitPricing.js';
import {
  gstProfileForCategory,
  lineTaxAmounts,
  priceWithoutGst,
} from './orderInvoice.pricing.js';

async function categoryByProductId(ids) {
  const unique = [...new Set(ids.filter(Boolean).map(String))];
  if (!unique.length) return new Map();
  const rows = await CatalogProduct.find({ _id: { $in: unique } }).select('category').lean();
  return new Map(rows.map((r) => [String(r._id), r.category || '']));
}

function mergeItemsByName(items = []) {
  const map = new Map();
  for (const item of items) {
    const name = String(item.name || 'Item').trim();
    const key = name.toLowerCase();
    const prev = map.get(key);
    if (prev) {
      prev.qty += Number(item.qty) || 0;
    } else {
      map.set(key, {
        name,
        qty: Number(item.qty) || 0,
        unitPriceInr: Number(item.unitPriceInr) || 0,
        catalogProductId: item.catalogProductId,
        hsnCode: item.hsnCode || '',
      });
    }
  }
  return [...map.values()];
}

function kitQuantity(order, campaign) {
  if (campaign.fulfillmentMode === 'single') {
    return Math.max(1, Number(campaign.recipientCount) || 1);
  }
  return 1;
}

function kitUnitPriceInclGst(order, campaign, kitEntries) {
  if (kitEntries?.length) {
    return Math.round(sumKitProductPrices(kitEntries.map((e) => e.product)));
  }
  const itemsSubtotal = (order.items || []).reduce(
    (sum, i) => sum + Number(i.unitPriceInr || 0) * Number(i.qty || 0),
    0,
  );
  const qty = kitQuantity(order, campaign);
  return qty > 0 ? Math.round(itemsSubtotal / qty) : itemsSubtotal;
}

/**
 * Build invoice line items for PDF + tax summary.
 * Packaging is folded into the kit/product rate — never a separate line.
 * @returns {Promise<Array<{name, hsn, qty, rate, amount, profile}>>}
 */
export async function buildOrderInvoiceLines({ order, campaign, kit, kitEntries = [] }) {
  const packagingIncl = Math.round(Number(order.amountBreakdown?.packaging) || 0);
  const lines = [];

  if (campaign.type === 'kit' && campaign.kitId && kit) {
    const qty = kitQuantity(order, campaign);
    const unitIncl = kitUnitPriceInclGst(order, campaign, kitEntries);
    const packagingPerUnitIncl = qty > 0 ? packagingIncl / qty : packagingIncl;
    const combinedIncl = Math.round(unitIncl + packagingPerUnitIncl);
    const rate = priceWithoutGst(combinedIncl, 'kit');
    lines.push({
      name: kit.name || campaign.name || 'Kit',
      hsn: '',
      qty,
      rate,
      amount: rate * qty,
      profile: 'kit',
    });
    return lines;
  }

  const merged = mergeItemsByName(order.items);
  const categories = await categoryByProductId(merged.map((m) => m.catalogProductId));
  for (const item of merged) {
    const category = categories.get(String(item.catalogProductId)) || '';
    const profile = gstProfileForCategory(category);
    const rate = priceWithoutGst(item.unitPriceInr, profile);
    lines.push({
      name: item.name,
      hsn: '',
      qty: item.qty,
      rate,
      amount: rate * item.qty,
      profile,
    });
  }

  // Fold packaging into the first product line (ex-GST) when present.
  if (packagingIncl > 0 && lines.length > 0) {
    const pkgRate = priceWithoutGst(packagingIncl, 'packaging');
    lines[0].rate += pkgRate;
    lines[0].amount += pkgRate;
  }

  return lines;
}

export function aggregateGstRows(lines) {
  const buckets = new Map();
  for (const line of lines) {
    const key = `${line.hsn}|${line.profile}`;
    const prev = buckets.get(key) || {
      hsn: line.hsn,
      profile: line.profile,
      taxable: 0,
    };
    prev.taxable += line.amount;
    buckets.set(key, prev);
  }
  return [...buckets.values()];
}

export function summarizeBodyGst(lines) {
  const totals = { cgst25: 0, sgst25: 0, cgst9: 0, sgst9: 0 };
  for (const line of lines) {
    const taxable = line.amount;
    if (line.profile === 'apparel') {
      totals.cgst25 += taxable * 0.025;
      totals.sgst25 += taxable * 0.025;
    } else {
      totals.cgst9 += taxable * 0.09;
      totals.sgst9 += taxable * 0.09;
    }
  }
  return {
    cgst25: Math.round(totals.cgst25 * 100) / 100,
    sgst25: Math.round(totals.sgst25 * 100) / 100,
    cgst9: Math.round(totals.cgst9 * 100) / 100,
    sgst9: Math.round(totals.sgst9 * 100) / 100,
  };
}

export function buildHsnSummary(lines) {
  const groups = aggregateGstRows(lines);
  return groups.map((g) => {
    const tax = lineTaxAmounts(g.taxable, g.profile);
    return {
      hsn: g.hsn || '-',
      taxable: g.taxable,
      cgstRate: tax.cgstRate,
      cgstAmt: tax.cgstAmt,
      sgstRate: tax.sgstRate,
      sgstAmt: tax.sgstAmt,
      totalTax: tax.totalTax,
    };
  });
}
