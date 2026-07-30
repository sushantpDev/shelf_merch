import PDFDocument from 'pdfkit';
import fs from 'fs';
import { summarizeBodyGst } from './orderInvoice.lines.js';

const COMPANY = {
  name: 'Chitlu Innovations Private Limited',
  addressLines: [
    'SY No 18, G2, Win Win Towers, Khanamet, SiddhiVinayak Nagar,',
    'Madhapur, Hyderabad, Telangana, 500081',
  ],
  gstin: '36AAHCC5155C1ZW',
  mobile: '9951365724',
  pan: 'AAHCC5155C',
  email: 'shelfmerch@gmail.com',
  bankName: 'Chitlu Innovations Private Limited',
  ifsc: 'FDRL0001332',
  account: '13320200016019',
  bankBranch: 'Federal Bank ,HYDERABAD LAKADI KA PUL',
  upi: '8887222888@okbizaxis',
};

const FONT_CANDIDATES = [
  'C:/Windows/Fonts/arial.ttf',
  'C:/Windows/Fonts/calibri.ttf',
  'C:/Windows/Fonts/segoeui.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/System/Library/Fonts/Supplemental/Arial.ttf',
];
const FONT_BOLD_CANDIDATES = [
  'C:/Windows/Fonts/arialbd.ttf',
  'C:/Windows/Fonts/calibrib.ttf',
  'C:/Windows/Fonts/segoeuib.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
  '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
];

function firstExisting(paths) {
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function registerFonts(doc) {
  const regular = firstExisting(FONT_CANDIDATES);
  const bold = firstExisting(FONT_BOLD_CANDIDATES) || regular;
  if (regular) {
    doc.registerFont('Invoice', regular);
    doc.registerFont('Invoice-Bold', bold);
    return { regular: 'Invoice', bold: 'Invoice-Bold', rupee: true };
  }
  return { regular: 'Helvetica', bold: 'Helvetica-Bold', rupee: false };
}

function fmtNum(n, decimals = 0) {
  const v = Number(n) || 0;
  if (decimals === 0 && Number.isInteger(v)) {
    return Math.round(v).toLocaleString('en-IN');
  }
  return v.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtMoney(n, { forceDecimals = false, withSymbol = true, fonts } = {}) {
  const v = Number(n) || 0;
  const decimals = forceDecimals || !Number.isInteger(v) ? 2 : 0;
  const num = fmtNum(v, decimals);
  if (!withSymbol) return num;
  if (fonts?.rupee) return `₹ ${num}`;
  return `Rs. ${num}`;
}

function strokeRect(doc, x, y, w, h) {
  doc.lineWidth(0.7).rect(x, y, w, h).stroke('#000');
}

function fillStrokeRect(doc, x, y, w, h, fill = '#efefef') {
  doc.save();
  doc.lineWidth(0.7).rect(x, y, w, h).fillAndStroke(fill, '#000');
  doc.restore();
  doc.fillColor('#000');
}

function setFont(doc, fonts, bold, size) {
  doc.font(bold ? fonts.bold : fonts.regular).fontSize(size).fillColor('#000');
}

function cellText(doc, fonts, text, x, y, w, h, opts = {}) {
  const padX = opts.padX ?? 4;
  const padY = opts.padY ?? 3;
  setFont(doc, fonts, opts.bold, opts.size || 8);
  doc.text(String(text ?? ''), x + padX, y + padY, {
    width: w - padX * 2,
    height: h - padY * 2,
    align: opts.align || 'left',
    ellipsis: true,
  });
}

function textHeight(doc, fonts, text, width, size = 8, bold = false) {
  setFont(doc, fonts, bold, size);
  return doc.heightOfString(String(text || ' '), { width });
}

/**
 * Tax invoice PDF matching the Chitlu / ShelfMerch template layout.
 * @returns {Promise<Buffer>}
 */
export function renderOrderInvoicePdf(data) {
  return new Promise((resolve, reject) => {
    const margin = 28;
    const doc = new PDFDocument({ margin, size: 'A4' });
    const fonts = registerFonts(doc);
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const left = margin;
    const right = pageW - margin;
    const contentW = right - left;
    let y = margin;

    // Outer page border
    strokeRect(doc, left, margin, contentW, pageH - margin * 2);

    // ── Header: TAX INVOICE | ORIGINAL FOR RECIPIENT ──
    const headerH = 22;
    const titleW = contentW * 0.62;
    strokeRect(doc, left, y, titleW, headerH);
    cellText(doc, fonts, 'TAX INVOICE', left, y, titleW, headerH, {
      bold: true,
      size: 12,
      align: 'center',
      padY: 5,
    });
    strokeRect(doc, left + titleW, y, contentW - titleW, headerH);
    cellText(doc, fonts, 'ORIGINAL FOR RECIPIENT', left + titleW, y, contentW - titleW, headerH, {
      bold: true,
      size: 9,
      align: 'center',
      padY: 6,
    });
    y += headerH;

    // ── Company | Invoice meta ──
    const companyW = titleW;
    const metaW = contentW - companyW;
    const metaRows = [
      ['Invoice No.', data.invoiceNumber],
      ['Invoice Date', data.invoiceDate],
    ];
    if (data.dueDate) metaRows.push(['Due Date', data.dueDate]);

    const companyBlockH =
      14 + // name
      COMPANY.addressLines.length * 11 +
      11 * 3 + // gstin/mobile, pan, email
      14;
    const metaH = Math.max(companyBlockH, metaRows.length * 26 + 4);

    strokeRect(doc, left, y, companyW, metaH);
    strokeRect(doc, left + companyW, y, metaW, metaH);

    let cy = y + 6;
    setFont(doc, fonts, true, 10);
    doc.text(COMPANY.name, left + 6, cy, { width: companyW - 12 });
    cy += 14;
    setFont(doc, fonts, false, 8);
    for (const line of COMPANY.addressLines) {
      doc.text(line, left + 6, cy, { width: companyW - 12 });
      cy += 11;
    }
    doc.text(`GSTIN: ${COMPANY.gstin}   Mobile: ${COMPANY.mobile}`, left + 6, cy, {
      width: companyW - 12,
    });
    cy += 11;
    doc.text(`PAN Number: ${COMPANY.pan}`, left + 6, cy, { width: companyW - 12 });
    cy += 11;
    doc.text(`Email: ${COMPANY.email}`, left + 6, cy, { width: companyW - 12 });

    let my = y;
    const rowHMeta = metaH / metaRows.length;
    for (const [label, value] of metaRows) {
      strokeRect(doc, left + companyW, my, metaW, rowHMeta);
      cellText(doc, fonts, label, left + companyW, my, metaW, 13, {
        bold: true,
        size: 8,
        padY: 2,
      });
      cellText(doc, fonts, value, left + companyW, my + 12, metaW, rowHMeta - 12, {
        size: 10,
        padY: 2,
      });
      my += rowHMeta;
    }
    y += metaH;

    // ── BILL TO | SHIP TO ──
    const half = contentW / 2;
    const billInnerW = half - 12;
    const shipInnerW = half - 12;

    const billName = data.billTo?.name || '—';
    const billParts = [
      { text: `Address: ${data.billTo?.address || '—'}`, bold: false },
    ];
    if (data.billTo?.gstin) billParts.push({ text: `GSTIN: ${data.billTo.gstin}`, bold: false });
    if (data.billTo?.placeOfSupply) {
      billParts.push({ text: `Place of Supply: ${data.billTo.placeOfSupply}`, bold: false });
    }
    if (data.billTo?.mobile) billParts.push({ text: `Mobile: ${data.billTo.mobile}`, bold: false });

    const shipName = data.shipTo?.name || '—';
    const shipParts = [{ text: `Address: ${data.shipTo?.address || '—'}`, bold: false }];

    const billBodyH =
      textHeight(doc, fonts, billName, billInnerW, 9, true) +
      4 +
      billParts.reduce((h, p) => h + textHeight(doc, fonts, p.text, billInnerW, 8) + 3, 0);
    const shipBodyH =
      textHeight(doc, fonts, shipName, shipInnerW, 9, true) +
      4 +
      shipParts.reduce((h, p) => h + textHeight(doc, fonts, p.text, shipInnerW, 8) + 3, 0);
    const partyH = 18 + Math.max(billBodyH, shipBodyH) + 8;

    strokeRect(doc, left, y, half, partyH);
    strokeRect(doc, left + half, y, half, partyH);
    cellText(doc, fonts, 'BILL TO', left, y, half, 16, { bold: true, size: 9, padY: 3 });
    cellText(doc, fonts, 'SHIP TO', left + half, y, half, 16, { bold: true, size: 9, padY: 3 });

    let by = y + 18;
    setFont(doc, fonts, true, 9);
    doc.text(billName, left + 6, by, { width: billInnerW });
    by += textHeight(doc, fonts, billName, billInnerW, 9, true) + 4;
    for (const part of billParts) {
      setFont(doc, fonts, false, 8);
      doc.text(part.text, left + 6, by, { width: billInnerW });
      by += textHeight(doc, fonts, part.text, billInnerW, 8) + 3;
    }

    let sy = y + 18;
    setFont(doc, fonts, true, 9);
    doc.text(shipName, left + half + 6, sy, { width: shipInnerW });
    sy += textHeight(doc, fonts, shipName, shipInnerW, 9, true) + 4;
    for (const part of shipParts) {
      setFont(doc, fonts, false, 8);
      doc.text(part.text, left + half + 6, sy, { width: shipInnerW });
      sy += textHeight(doc, fonts, part.text, shipInnerW, 8) + 3;
    }
    y += partyH;

    // ── Items table ──
    const cols = [
      { key: 'sno', label: 'S.NO.', w: 36, align: 'center' },
      { key: 'item', label: 'ITEMS', w: 210, align: 'left' },
      { key: 'hsn', label: 'HSN', w: 58, align: 'center' },
      { key: 'qty', label: 'QTY.', w: 52, align: 'center' },
      { key: 'rate', label: 'RATE', w: 70, align: 'right' },
      { key: 'amount', label: 'AMOUNT', w: contentW - 36 - 210 - 58 - 52 - 70, align: 'right' },
    ];
    const headerH2 = 20;
    let x = left;
    for (const col of cols) {
      fillStrokeRect(doc, x, y, col.w, headerH2, '#efefef');
      cellText(doc, fonts, col.label, x, y, col.w, headerH2, {
        bold: true,
        size: 8,
        align: 'center',
        padY: 5,
      });
      x += col.w;
    }
    y += headerH2;

    const rowH = 22;
    const lines = data.lines || [];
    lines.forEach((line, idx) => {
      const values = [
        String(idx + 1),
        line.name,
        line.hsn || '-',
        `${line.qty} PCS`,
        fmtNum(line.rate),
        fmtNum(line.amount),
      ];
      x = left;
      values.forEach((val, i) => {
        strokeRect(doc, x, y, cols[i].w, rowH);
        cellText(doc, fonts, val, x, y, cols[i].w, rowH, {
          size: 8,
          align: cols[i].align,
          padY: 5,
        });
        x += cols[i].w;
      });
      y += rowH;
    });

    // Spacer rows so tax lines sit toward the bottom of the items block (template look)
    const minItemRows = 4;
    const spacerCount = Math.max(0, minItemRows - lines.length);
    for (let i = 0; i < spacerCount; i += 1) {
      x = left;
      for (const col of cols) {
        strokeRect(doc, x, y, col.w, rowH);
        x += col.w;
      }
      y += rowH;
    }

    const gst = data.bodyGst || {};
    const gstRows = [];
    if (gst.cgst25 > 0) gstRows.push(['CGST @2.5%', gst.cgst25]);
    if (gst.sgst25 > 0) gstRows.push(['SGST @2.5%', gst.sgst25]);
    if (gst.cgst9 > 0) gstRows.push(['CGST @9%', gst.cgst9]);
    if (gst.sgst9 > 0) gstRows.push(['SGST @9%', gst.sgst9]);
    if (gst.packagingCgst9 > 0) gstRows.push(['CGST @9% (Packaging)', gst.packagingCgst9]);
    if (gst.packagingSgst9 > 0) gstRows.push(['SGST @9% (Packaging)', gst.packagingSgst9]);
    if (data.roundOff) gstRows.push(['Round Off', data.roundOff]);

    for (const [label, amt] of gstRows) {
      x = left;
      const values = [
        '',
        label,
        '',
        '',
        '',
        fmtMoney(amt, { forceDecimals: true, fonts }),
      ];
      values.forEach((val, i) => {
        strokeRect(doc, x, y, cols[i].w, rowH);
        cellText(doc, fonts, val, x, y, cols[i].w, rowH, {
          size: 8,
          align: cols[i].align,
          padY: 5,
        });
        x += cols[i].w;
      });
      y += rowH;
    }

    const totalQty = lines.reduce((s, l) => s + Number(l.qty || 0), 0);
    x = left;
    const totalVals = [
      '',
      'TOTAL',
      '',
      String(totalQty),
      '',
      fmtMoney(data.grandTotal, { fonts }),
    ];
    totalVals.forEach((val, i) => {
      fillStrokeRect(doc, x, y, cols[i].w, rowH, '#efefef');
      cellText(doc, fonts, val, x, y, cols[i].w, rowH, {
        bold: true,
        size: 9,
        align: cols[i].align,
        padY: 5,
      });
      x += cols[i].w;
    });
    y += rowH + 10;

    // ── HSN summary ──
    const hsnCols = [
      { w: 70, label: 'HSN/SAC', align: 'center' },
      { w: 85, label: 'Taxable Value', align: 'right' },
      { w: 48, label: 'CGST\nRate', align: 'center' },
      { w: 60, label: 'Amount', align: 'right' },
      { w: 48, label: 'SGST\nRate', align: 'center' },
      { w: 60, label: 'Amount', align: 'right' },
      { w: contentW - 70 - 85 - 48 - 60 - 48 - 60, label: 'Total Tax Amount', align: 'right' },
    ];
    const hsnHeaderH = 28;
    x = left;
    for (const col of hsnCols) {
      fillStrokeRect(doc, x, y, col.w, hsnHeaderH, '#efefef');
      cellText(doc, fonts, col.label, x, y, col.w, hsnHeaderH, {
        bold: true,
        size: 7,
        align: 'center',
        padY: 6,
      });
      x += col.w;
    }
    y += hsnHeaderH;

    const hsnRows = data.hsnSummary || [];
    let sumTaxable = 0;
    let sumCgst = 0;
    let sumSgst = 0;
    let sumTax = 0;
    for (const row of hsnRows) {
      sumTaxable += row.taxable;
      sumCgst += row.cgstAmt;
      sumSgst += row.sgstAmt;
      sumTax += row.totalTax;
      const vals = [
        row.hsn,
        fmtNum(row.taxable, Number.isInteger(row.taxable) ? 0 : 2),
        `${row.cgstRate}%`,
        fmtNum(row.cgstAmt, 2),
        `${row.sgstRate}%`,
        fmtNum(row.sgstAmt, 2),
        fmtMoney(row.totalTax, { forceDecimals: true, fonts }),
      ];
      x = left;
      vals.forEach((val, i) => {
        strokeRect(doc, x, y, hsnCols[i].w, 18);
        cellText(doc, fonts, val, x, y, hsnCols[i].w, 18, {
          size: 7,
          align: hsnCols[i].align,
          padY: 4,
        });
        x += hsnCols[i].w;
      });
      y += 18;
    }

    x = left;
    const totalHsn = [
      'Total',
      fmtNum(sumTaxable, Number.isInteger(sumTaxable) ? 0 : 2),
      '',
      fmtNum(sumCgst, 2),
      '',
      fmtNum(sumSgst, 2),
      fmtMoney(sumTax, { forceDecimals: true, fonts }),
    ];
    totalHsn.forEach((val, i) => {
      fillStrokeRect(doc, x, y, hsnCols[i].w, 18, '#efefef');
      cellText(doc, fonts, val, x, y, hsnCols[i].w, 18, {
        bold: true,
        size: 7,
        align: hsnCols[i].align,
        padY: 4,
      });
      x += hsnCols[i].w;
    });
    y += 22;

    // ── Amount in words ──
    setFont(doc, fonts, true, 8);
    doc.text('Total Amount (in words)', left + 4, y);
    y += 12;
    setFont(doc, fonts, false, 9);
    doc.text(data.amountInWords || '', left + 4, y, { width: contentW - 8 });
    y += 24;

    // ── Bank | QR | Signature ──
    const footerTop = Math.max(y, pageH - margin - 120);
    const footH = pageH - margin - footerTop;
    const bankW = contentW * 0.42;
    const qrW = contentW * 0.28;
    const signW = contentW - bankW - qrW;

    strokeRect(doc, left, footerTop, bankW, footH);
    strokeRect(doc, left + bankW, footerTop, qrW, footH);
    strokeRect(doc, left + bankW + qrW, footerTop, signW, footH);

    let fy = footerTop + 6;
    setFont(doc, fonts, true, 8);
    doc.text('Bank Details', left + 6, fy);
    fy += 14;
    setFont(doc, fonts, false, 7);
    doc.text(`Name: ${COMPANY.bankName}`, left + 6, fy, { width: bankW - 12 });
    fy += 11;
    doc.text(`IFSC Code: ${COMPANY.ifsc}`, left + 6, fy, { width: bankW - 12 });
    fy += 11;
    doc.text(`Account No: ${COMPANY.account}`, left + 6, fy, { width: bankW - 12 });
    fy += 11;
    doc.text(`Bank: ${COMPANY.bankBranch}`, left + 6, fy, { width: bankW - 12 });

    const qx = left + bankW + 6;
    setFont(doc, fonts, true, 8);
    doc.text('Payment QR Code', qx, footerTop + 6, { width: qrW - 12 });
    setFont(doc, fonts, false, 7);
    doc.text(`UPI ID:\n${COMPANY.upi}`, qx, footerTop + 22, { width: qrW - 12 });

    const sx = left + bankW + qrW + 6;
    setFont(doc, fonts, false, 7);
    doc.text('Authorised Signatory For', sx, footerTop + 6, { width: signW - 12 });
    setFont(doc, fonts, true, 8);
    doc.text(COMPANY.name, sx, footerTop + 20, { width: signW - 12 });
    setFont(doc, fonts, false, 7);
    doc.text("Receiver's Signature", sx, footerTop + footH - 28, { width: signW - 12 });

    doc.end();
  });
}

export function computeInvoiceTotals(lines) {
  const taxableTotal = lines.reduce((s, l) => s + l.amount, 0);
  const bodyGst = summarizeBodyGst(lines);
  const gstTotal =
    bodyGst.cgst25 +
    bodyGst.sgst25 +
    bodyGst.cgst9 +
    bodyGst.sgst9 +
    (bodyGst.packagingCgst9 || 0) +
    (bodyGst.packagingSgst9 || 0);
  const rawTotal = taxableTotal + gstTotal;
  // Round up to the next rupee when there are paise — never reduce the total.
  const paise = Math.round(rawTotal * 100);
  const grandTotal = Math.ceil(paise / 100);
  const roundOff = Math.round(grandTotal * 100 - paise) / 100;
  return { taxableTotal, bodyGst, gstTotal, grandTotal, roundOff };
}

export { COMPANY };
