import PDFDocument from 'pdfkit';
import { amountInWordsInr } from '../../utils/amountInWords.js';
import { summarizeBodyGst } from './orderInvoice.lines.js';

const COMPANY = {
  name: 'Chitlu Innovations Private Limited',
  address:
    'SY No 18, G2, Win Win Towers, Khanamet, SiddhiVinayak Nagar, Madhapur, Hyderabad, Telangana, 500081',
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

function fmtInr(n) {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString('en-IN');
}

function fmtMoney(n) {
  const v = Number(n) || 0;
  if (Number.isInteger(v)) return `₹ ${fmtInr(v)}`;
  return `₹ ${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function drawCell(doc, x, y, w, h, text, opts = {}) {
  doc.rect(x, y, w, h).stroke();
  doc
    .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(opts.size || 8)
    .fillColor('#000')
    .text(String(text ?? ''), x + 4, y + 4, { width: w - 8, align: opts.align || 'left' });
}

/**
 * @param {object} data
 * @returns {Promise<Buffer>}
 */
export function renderOrderInvoicePdf(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 28, size: 'A4' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const left = doc.page.margins.left;

    doc.font('Helvetica-Bold').fontSize(11).text(COMPANY.name, left, doc.y);
    doc.font('Helvetica').fontSize(8);
    doc.text(COMPANY.address);
    doc.text(`GSTIN: ${COMPANY.gstin}  Mobile: ${COMPANY.mobile}`);
    doc.text(`PAN Number: ${COMPANY.pan}`);
    doc.text(`Email: ${COMPANY.email}`);
    doc.moveDown(0.5);

    const metaY = doc.y;
    doc.font('Helvetica-Bold').fontSize(9).text('Invoice No.', left + pageW * 0.55, metaY);
    doc.font('Helvetica').text(data.invoiceNumber, left + pageW * 0.55, metaY + 12);
    doc.font('Helvetica-Bold').text('Invoice Date', left + pageW * 0.75, metaY);
    doc
      .font('Helvetica')
      .text(data.invoiceDate, left + pageW * 0.75, metaY + 12);

    doc.moveDown(1.2);
    const billY = doc.y;
    doc.font('Helvetica-Bold').fontSize(9).text('BILL TO', left, billY);
    doc.font('Helvetica').fontSize(8);
    doc.text(data.billTo.name, left, billY + 14);
    doc.text(`Address: ${data.billTo.address}`, left, doc.y + 2, { width: pageW * 0.45 });
    if (data.billTo.gstin) doc.text(`GSTIN: ${data.billTo.gstin}`, left);
    if (data.billTo.placeOfSupply) doc.text(`Place of Supply: ${data.billTo.placeOfSupply}`, left);
    if (data.billTo.mobile) doc.text(`Mobile: ${data.billTo.mobile}`, left);

    const shipX = left + pageW * 0.5;
    doc.font('Helvetica-Bold').fontSize(9).text('SHIP TO', shipX, billY);
    doc.font('Helvetica').fontSize(8);
    doc.text(data.shipTo.name, shipX, billY + 14);
    doc.text(data.shipTo.address, shipX, doc.y + 2, { width: pageW * 0.45 });

    doc.moveDown(1.5);
    const tableTop = doc.y;
    const cols = [28, 200, 52, 42, 58, 72];
    const headers = ['S.NO.', 'ITEMS', 'HSN', 'QTY.', 'RATE', 'AMOUNT'];
    let x = left;
    const headerH = 22;
    headers.forEach((h, i) => {
      drawCell(doc, x, tableTop, cols[i], headerH, h, { bold: true, size: 7 });
      x += cols[i];
    });

    let rowY = tableTop + headerH;
    const rowH = 20;
    data.lines.forEach((line, idx) => {
      x = left;
      const cells = [
        String(idx + 1),
        line.name,
        line.hsn || '-',
        `${line.qty} PCS`,
        fmtInr(line.rate),
        fmtInr(line.amount),
      ];
      cells.forEach((cell, i) => {
        drawCell(doc, x, rowY, cols[i], rowH, cell, { size: 7 });
        x += cols[i];
      });
      rowY += rowH;
    });

    const gst = data.bodyGst;
    const gstRows = [];
    if (gst.cgst25 > 0) gstRows.push(['CGST @2.5%', gst.cgst25]);
    if (gst.sgst25 > 0) gstRows.push(['SGST @2.5%', gst.sgst25]);
    if (gst.cgst9 > 0) gstRows.push(['CGST @9%', gst.cgst9]);
    if (gst.sgst9 > 0) gstRows.push(['SGST @9%', gst.sgst9]);

    for (const [label, amt] of gstRows) {
      x = left;
      drawCell(doc, x, rowY, cols[0], rowH, '', { size: 7 });
      x += cols[0];
      drawCell(doc, x, rowY, cols[1], rowH, label, { size: 7 });
      x += cols[1];
      drawCell(doc, x, rowY, cols[2], rowH, '-', { size: 7 });
      x += cols[2];
      drawCell(doc, x, rowY, cols[3], rowH, '-', { size: 7 });
      x += cols[3];
      drawCell(doc, x, rowY, cols[4], rowH, '-', { size: 7 });
      x += cols[4];
      drawCell(doc, x, rowY, cols[5], rowH, fmtMoney(amt), { size: 7, align: 'right' });
      rowY += rowH;
    }

    if (data.roundOff !== 0) {
      x = left;
      drawCell(doc, x, rowY, cols[0], rowH, '', { size: 7 });
      x += cols[0];
      drawCell(doc, x, rowY, cols[1], rowH, 'Round Off', { size: 7 });
      x += cols[1] + cols[2] + cols[3] + cols[4];
      drawCell(doc, x, rowY, cols[5], rowH, fmtMoney(data.roundOff), { size: 7, align: 'right' });
      rowY += rowH;
    }

    x = left;
    const totalQty = data.lines.reduce((s, l) => s + l.qty, 0);
    drawCell(doc, x, rowY, cols[0], rowH, '', { size: 7 });
    x += cols[0];
    drawCell(doc, x, rowY, cols[1], rowH, 'TOTAL', { bold: true, size: 8 });
    x += cols[1] + cols[2];
    drawCell(doc, x, rowY, cols[3], rowH, String(totalQty), { bold: true, size: 8 });
    x += cols[3] + cols[4];
    drawCell(doc, x, rowY, cols[5], rowH, fmtMoney(data.grandTotal), { bold: true, size: 8, align: 'right' });

    rowY += rowH + 10;
    doc.font('Helvetica-Bold').fontSize(8).text('HSN/SAC', left, rowY);
    const hsnCols = [60, 80, 45, 55, 45, 55, 65];
    const hsnHeaders = ['', 'Taxable Value', 'CGST Rate', 'Amount', 'SGST Rate', 'Amount', 'Total Tax Amount'];
    x = left;
    hsnHeaders.forEach((h, i) => {
      drawCell(doc, x, rowY + 12, hsnCols[i], 18, h, { bold: true, size: 6 });
      x += hsnCols[i];
    });

    let hsnY = rowY + 30;
    for (const row of data.hsnSummary) {
      x = left;
      const cells = [
        row.hsn,
        fmtInr(row.taxable),
        `${row.cgstRate}%`,
        fmtInr(row.cgstAmt),
        `${row.sgstRate}%`,
        fmtInr(row.sgstAmt),
        fmtMoney(row.totalTax),
      ];
      cells.forEach((cell, i) => {
        drawCell(doc, x, hsnY, hsnCols[i], 16, cell, { size: 6 });
        x += hsnCols[i];
      });
      hsnY += 16;
    }

    hsnY += 8;
    doc.font('Helvetica-Bold').fontSize(8).text('Total Amount (in words)', left, hsnY);
    doc.font('Helvetica').fontSize(8).text(data.amountInWords, left, hsnY + 14, { width: pageW });

    const footerY = Math.max(hsnY + 36, doc.page.height - 200);
    doc.font('Helvetica-Bold').fontSize(8).text('Bank Details', left, footerY);
    doc.font('Helvetica').fontSize(7);
    doc.text(`Name: ${COMPANY.bankName}`, left, footerY + 12);
    doc.text(`IFSC Code: ${COMPANY.ifsc}`, left);
    doc.text(`Account No: ${COMPANY.account}`, left);
    doc.text(`Bank: ${COMPANY.bankBranch}`, left);

    const qrX = left + pageW * 0.55;
    doc.font('Helvetica-Bold').fontSize(8).text('Payment QR Code', qrX, footerY);
    doc.font('Helvetica').fontSize(7).text(`UPI ID:\n${COMPANY.upi}`, qrX, footerY + 14);

    const signY = footerY + 70;
    doc.font('Helvetica').fontSize(7).text('Authorised Signatory For', left, signY);
    doc.font('Helvetica-Bold').text(COMPANY.name, left, signY + 12);
    doc.font('Helvetica').text("Receiver's Signature", qrX, signY);

    doc.font('Helvetica-Bold').fontSize(10).text('TAX INVOICE ORIGINAL FOR RECIPIENT', left, signY + 40, {
      align: 'center',
      width: pageW,
    });

    doc.end();
  });
}

export function computeInvoiceTotals(lines) {
  const taxableTotal = lines.reduce((s, l) => s + l.amount, 0);
  const bodyGst = summarizeBodyGst(lines);
  const gstTotal = bodyGst.cgst25 + bodyGst.sgst25 + bodyGst.cgst9 + bodyGst.sgst9;
  const rawTotal = taxableTotal + gstTotal;
  const grandTotal = Math.round(rawTotal);
  const roundOff = Math.round((grandTotal - rawTotal) * 100) / 100;
  return { taxableTotal, bodyGst, gstTotal, grandTotal, roundOff };
}

export { COMPANY };
