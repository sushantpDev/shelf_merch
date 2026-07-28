import { OrderInvoice } from './orderInvoice.model.js';
import { Campaign } from '../campaigns/campaign.model.js';
import { Kit } from '../kits/kit.model.js';
import { Wallet } from '../wallets/wallet.model.js';
import { User } from '../users/user.model.js';
import { Entity } from '../entities/entity.model.js';
import { loadActiveKitEntriesForInvoice } from './orderInvoice.kit.js';
import { uploadBuffer } from '../../services/storage.service.js';
import { sendEmail, appUrl } from '../../services/email.service.js';
import { logger } from '../../config/logger.js';
import { NotFoundError } from '../../utils/errors.js';
import { amountInWordsInr } from '../../utils/amountInWords.js';
import { buildOrderInvoiceLines, buildHsnSummary } from './orderInvoice.lines.js';
import { computeInvoiceTotals, renderOrderInvoicePdf } from './orderInvoice.pdf.js';

function formatInvoiceDate(date) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatAddress(parts) {
  return parts.filter(Boolean).join(', ');
}

function buildBillTo(wallet) {
  const address = formatAddress([
    wallet.address,
    wallet.pinCode ? String(wallet.pinCode) : '',
  ]);
  return {
    name: wallet.name || 'Customer',
    address: address || '—',
    gstin: wallet.gstin || '',
    mobile: wallet.mobileNumber || '',
    placeOfSupply: '',
  };
}

function buildShipTo(order, campaign, multiRecipient) {
  if (multiRecipient) {
    return {
      name: order.shippingAddress?.name || 'Recipient',
      address: "Shipped to respective recipient's address.",
    };
  }
  const addr = order.shippingAddress || {};
  return {
    name: addr.name || 'Recipient',
    address: formatAddress([
      addr.line1,
      addr.line2,
      [addr.city, addr.state].filter(Boolean).join(', '),
      addr.pincode,
    ]),
  };
}

function isShopOrder(campaign) {
  return campaign.type === 'points' && Boolean(campaign.shopId);
}

async function resolveWalletForOrder(order, campaign) {
  const entity = await Entity.findOne({ _id: campaign.entityId, tenantId: order.tenantId }).lean();
  if (!entity?.walletId) return null;
  return Wallet.findOne({ _id: entity.walletId, tenantId: order.tenantId }).lean();
}

async function loadKitContext(campaign, tenantId) {
  if (campaign.type !== 'kit' || !campaign.kitId) return { kit: null, kitEntries: [] };
  const kit = await Kit.findOne({ _id: campaign.kitId, tenantId }).lean();
  if (!kit) return { kit: null, kitEntries: [] };
  const kitEntries = await loadActiveKitEntriesForInvoice(kit);
  return { kit, kitEntries };
}

export async function generateAndStoreOrderInvoice(orderDoc, { force = false, skipEmail = false } = {}) {
  const order = orderDoc.toObject ? orderDoc.toObject() : orderDoc;
  const tenantId = order.tenantId;

  const existing = await OrderInvoice.findOne({ orderId: order._id, tenantId });
  if (existing?.pdfUrl && !force) return existing;

  const campaign = await Campaign.findOne({ _id: order.campaignId, tenantId }).lean();
  if (!campaign) throw new NotFoundError('Campaign not found for order');

  const wallet = await resolveWalletForOrder(order, campaign);
  const { kit, kitEntries } = await loadKitContext(campaign, tenantId);

  const lines = await buildOrderInvoiceLines({ order, campaign, kit, kitEntries });
  const hsnSummary = buildHsnSummary(lines);
  const totals = computeInvoiceTotals(lines);

  const billTo = buildBillTo(wallet || {});
  billTo.placeOfSupply = order.shippingAddress?.state || '';

  const multiRecipient =
    campaign.fulfillmentMode === 'single' && (Number(campaign.recipientCount) || 0) > 1;
  const shipTo = buildShipTo(order, campaign, multiRecipient);

  const pdfBuffer = await renderOrderInvoicePdf({
    invoiceNumber: order.orderNumber,
    invoiceDate: formatInvoiceDate(order.createdAt || new Date()),
    billTo,
    shipTo,
    lines,
    bodyGst: totals.bodyGst,
    roundOff: totals.roundOff,
    grandTotal: totals.grandTotal,
    hsnSummary,
    amountInWords: amountInWordsInr(totals.grandTotal),
  });

  const { url } = await uploadBuffer({
    tenantId,
    kind: 'document',
    buffer: pdfBuffer,
    filename: `${order.orderNumber}.pdf`,
    contentType: 'application/pdf',
  });

  const invoice = await OrderInvoice.findOneAndUpdate(
    { orderId: order._id, tenantId },
    {
      $set: {
        invoiceNumber: order.orderNumber,
        pdfUrl: url,
        generatedAt: new Date(),
        status: 'generated',
      },
      $setOnInsert: { orderId: order._id, tenantId },
    },
    { upsert: true, new: true },
  );

  if (!skipEmail && !existing && !isShopOrder(campaign)) {
    await emailInvoiceToCompanyAdmin({ order, campaign, wallet, invoice, pdfBuffer });
  }

  return invoice;
}

async function emailInvoiceToCompanyAdmin({ order, campaign, wallet, invoice, pdfBuffer }) {
  try {
    let adminEmail = null;
    if (wallet?.ownerUserId) {
      const owner = await User.findById(wallet.ownerUserId).select('email name').lean();
      adminEmail = owner?.email;
    }
    if (!adminEmail) {
      const admin = await User.findOne({ tenantId: order.tenantId, role: 'company_admin' })
        .select('email')
        .lean();
      adminEmail = admin?.email;
    }
    if (!adminEmail) return;

    const orderUrl = appUrl(`/app/orders`);
    const subject = `Invoice ${invoice.invoiceNumber} — recipient order placed`;
    const text = [
      `A recipient has placed an order through your ${campaign.name || 'campaign'}.`,
      '',
      `Order Number: ${order.orderNumber}`,
      `Invoice Number: ${invoice.invoiceNumber}`,
      `Order Date: ${formatInvoiceDate(order.createdAt)}`,
      '',
      'The tax invoice PDF is attached to this email.',
      '',
      `View orders in ShelfMerch: ${orderUrl}`,
    ].join('\n');

    const html = `
      <p>A recipient has placed an order through your <strong>${campaign.name || 'campaign'}</strong>.</p>
      <ul>
        <li><strong>Order Number:</strong> ${order.orderNumber}</li>
        <li><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</li>
        <li><strong>Order Date:</strong> ${formatInvoiceDate(order.createdAt)}</li>
      </ul>
      <p>The tax invoice PDF is attached to this email.</p>
      <p><a href="${orderUrl}">View orders in ShelfMerch</a></p>
    `;

    await sendEmail({
      to: adminEmail,
      subject,
      text,
      html,
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  } catch (err) {
    logger.warn({ err, orderId: order._id }, 'Failed to email order invoice to company admin');
  }
}

/** Fire-and-forget hook after Order.create — never blocks order placement. */
export async function getOrderInvoiceByOrderId({ tenantId, orderId }) {
  const invoice = await OrderInvoice.findOne({ orderId, tenantId }).lean();
  if (!invoice) throw new NotFoundError('Invoice not found for this order');
  return invoice;
}

/** Generate invoice for an existing order if missing; return stored invoice. */
export async function ensureOrderInvoice({ tenantId, orderId }) {
  const { Order } = await import('../orders/order.model.js');
  const order = await Order.findOne({ _id: orderId, tenantId });
  if (!order) throw new NotFoundError('Order not found');

  // Always rebuild so layout/pricing fixes apply to older invoices.
  return generateAndStoreOrderInvoice(order, { force: true, skipEmail: true });
}

export async function getOrderInvoiceByOrderNumber({ tenantId, orderNumber }) {
  const { Order } = await import('../orders/order.model.js');
  const order = await Order.findOne({ orderNumber, tenantId }).select('_id').lean();
  if (!order) throw new NotFoundError('Order not found');
  return getOrderInvoiceByOrderId({ tenantId, orderId: order._id });
}
