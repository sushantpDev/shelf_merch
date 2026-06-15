import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { Recipient } from '../campaigns/recipient.model.js';
import { Campaign } from '../campaigns/campaign.model.js';
import { Shop } from '../shops/shop.model.js';
import { Collection } from '../collections/collection.model.js';
import { CatalogProduct } from '../catalog/catalogProduct.model.js';
import { Order, sanitizeOrderItems } from '../orders/order.model.js';
import { transitionRedemption } from '../campaigns/campaigns.service.js';
import { computeAmountBreakdown } from '../../services/pricing.service.js';
import { env } from '../../config/env.js';
import { sendOtpSms } from '../../services/msg91.service.js';
import { sendOtpEmail } from '../../services/email.service.js';
import { ApiError, NotFoundError } from '../../utils/errors.js';

const OTP_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL = '30m';
const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');

async function findRecipientByToken(token) {
  // Token is globally unique — the only public identifier on redemption routes.
  const recipient = await Recipient.findOne({ redemptionToken: token }).setOptions({ skipTenantGuard: true });
  if (!recipient) throw new NotFoundError('Invalid redemption link');
  return recipient;
}

async function loadCampaignContext(recipient) {
  const campaign = await Campaign.findOne({ _id: recipient.campaignId, tenantId: recipient.tenantId });
  if (!campaign) throw new NotFoundError('Campaign not found');
  if (!['launched', 'redemption_open'].includes(campaign.status)) {
    throw new ApiError(410, 'This redemption campaign is no longer active', 'CAMPAIGN_INACTIVE');
  }
  let shop = null;
  if (campaign.shopId) {
    shop = await Shop.findOne({ _id: campaign.shopId, tenantId: recipient.tenantId });
  }
  return { campaign, shop };
}

export async function getRedemptionPortal(token) {
  const recipient = await findRecipientByToken(token);

  if (['redeemed', 'order_created'].includes(recipient.redemptionStatus)) {
    const order = await Order.findOne({ recipientId: recipient._id, tenantId: recipient.tenantId });
    throw new ApiError(409, 'Already redeemed', 'ALREADY_REDEEMED', {
      orderNumber: order?.orderNumber,
      trackUrl: order ? `/api/v1/redemptions/${token}/track` : null,
    });
  }

  const { campaign, shop } = await loadCampaignContext(recipient);

  if (recipient.redemptionStatus === 'invited') {
    transitionRedemption(recipient, 'opened');
    await recipient.save();
  }

  const shopPayload = shop
    ? {
        name: shop.name,
        currencyMode: shop.currencyMode,
        logoUrl: shop.logoUrl || '',
        bannerTheme: shop.bannerConfig?.theme || 'light',
      }
    : null;

  if (recipient.redemptionStatus === 'verified') {
    return {
      alreadyVerified: true,
      sessionToken: signRedemptionSession(recipient),
      campaign: { name: campaign.name, message: campaign.message, shop: shopPayload },
      recipient: { name: recipient.name, creditAmount: recipient.creditAmount },
    };
  }

  return {
    campaign: {
      name: campaign.name,
      message: campaign.message,
      shop: shopPayload,
    },
    recipient: { name: recipient.name, creditAmount: recipient.creditAmount },
  };
}

export async function sendOtp(token, { contact }) {
  const recipient = await findRecipientByToken(token);
  await loadCampaignContext(recipient);

  const trimmed = contact.trim();
  const normalizedEmail = trimmed.toLowerCase();
  const normalizedPhone = trimmed.replace(/\s/g, '');
  const recipientPhone = recipient.phone?.replace(/\s/g, '') ?? '';

  const isEmail = normalizedEmail.includes('@');
  const matches =
    normalizedEmail === recipient.email.toLowerCase() ||
    (recipientPhone && normalizedPhone === recipientPhone);

  if (!matches) {
    throw new ApiError(400, 'Contact does not match the recipient on file', 'CONTACT_MISMATCH');
  }

  const code = String(crypto.randomInt(100_000, 999_999));
  recipient.otpHash = sha256(code);
  recipient.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  recipient.otpAttempts = 0;
  if (recipient.redemptionStatus === 'invited') {
    transitionRedemption(recipient, 'opened');
  }
  await recipient.save();

  if (isEmail) {
    await sendOtpEmail(recipient.email, code);
  } else {
    await sendOtpSms(trimmed, code);
  }

  return { success: true, expiresInSec: OTP_TTL_MS / 1000, channel: isEmail ? 'email' : 'sms' };
}

export function signRedemptionSession(recipient) {
  return jwt.sign(
    { sub: String(recipient._id), type: 'redemption', tenantId: String(recipient.tenantId) },
    env.JWT_ACCESS_SECRET,
    { expiresIn: SESSION_TTL },
  );
}

export function verifyRedemptionSession(token) {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (payload.type !== 'redemption') throw new Error('wrong type');
    return payload;
  } catch {
    throw new ApiError(401, 'Invalid or expired redemption session', 'INVALID_SESSION');
  }
}

export async function verifyOtp(token, { code }) {
  const recipient = await Recipient.findOne({ redemptionToken: token })
    .setOptions({ skipTenantGuard: true })
    .select('+otpHash');
  if (!recipient) throw new NotFoundError('Invalid redemption link');
  await loadCampaignContext(recipient);

  if (recipient.redemptionStatus === 'verified') {
    return { sessionToken: signRedemptionSession(recipient) };
  }

  if (!recipient.otpHash || !recipient.otpExpiresAt || recipient.otpExpiresAt < new Date()) {
    throw new ApiError(400, 'OTP expired — request a new code', 'OTP_EXPIRED');
  }
  if (recipient.otpAttempts >= 5) {
    throw new ApiError(429, 'Too many attempts — request a new code', 'OTP_LOCKED');
  }

  recipient.otpAttempts += 1;
  if (sha256(code) !== recipient.otpHash) {
    await recipient.save();
    throw new ApiError(400, 'Invalid OTP', 'OTP_INVALID');
  }

  recipient.otpHash = null;
  recipient.otpExpiresAt = null;
  if (recipient.redemptionStatus === 'verified') {
    await recipient.save();
    return { sessionToken: signRedemptionSession(recipient) };
  }
  if (recipient.redemptionStatus === 'invited') {
    transitionRedemption(recipient, 'opened');
  }
  transitionRedemption(recipient, 'verified');
  await recipient.save();

  return { sessionToken: signRedemptionSession(recipient) };
}

export async function getCatalog(token) {
  const recipient = await findRecipientByToken(token);
  const { campaign } = await loadCampaignContext(recipient);

  const filter = { status: 'active' };
  if (campaign.catalogMode === 'selected_products' && campaign.selectedProductIds.length) {
    // Campaign explicitly hand-picked products — those win over the shop.
    filter._id = { $in: campaign.selectedProductIds };
  } else if (campaign.shopId) {
    // Curated store: limit the catalog to products in the shop's collections so
    // recipients see the branded store's selection, not the whole platform catalog.
    const collections = await Collection.find({
      shopId: campaign.shopId,
      tenantId: recipient.tenantId,
      status: { $ne: 'archived' },
    })
      .select('productRefs')
      .lean();
    const ids = collections
      .flatMap((c) => (c.productRefs || []).map((r) => r.catalogProductId))
      .filter(Boolean);
    // Fall back to the full active catalog when the shop has no curated products yet,
    // so recipients are never stranded with an empty store.
    if (ids.length) filter._id = { $in: ids };
  }
  const products = await CatalogProduct.find(filter).sort({ name: 1 }).lean();
  return { products };
}

async function nextOrderNumber() {
  const year = new Date().getFullYear();
  const count = await Order.countDocuments({}).setOptions({ skipTenantGuard: true });
  return `SM-${year}-${String(count + 1).padStart(6, '0')}`;
}

/** §7.9 /submit — idempotent order creation from redemption. */
export async function submitRedemption(token, { items, shippingAddress }) {
  const recipient = await Recipient.findOne({ redemptionToken: token }).setOptions({ skipTenantGuard: true });
  if (!recipient) throw new NotFoundError('Invalid redemption link');
  const { campaign } = await loadCampaignContext(recipient);

  if (recipient.redemptionStatus === 'order_created') {
    const existing = await Order.findOne({ recipientId: recipient._id, tenantId: recipient.tenantId });
    return {
      orderNumber: existing.orderNumber,
      estimatedDelivery: '7-10 business days',
      idempotentReplay: true,
    };
  }
  if (recipient.redemptionStatus !== 'verified') {
    throw new ApiError(403, 'Verify OTP before submitting your order', 'NOT_VERIFIED');
  }

  // Non-negotiable #4: every order item carries a full product snapshot
  // (price, cost, GST, HSN, image) frozen at order time.
  const lineItems = [];
  for (const item of items) {
    const product = await CatalogProduct.findById(item.productId).select('+costPriceInr');
    if (!product) throw new NotFoundError(`Product ${item.productId} not found`);
    lineItems.push({
      catalogProductId: product._id,
      name: product.name,
      sku: product.sku,
      variant: item.variant ?? {},
      qty: item.qty,
      unitPriceInr: product.basePriceInr,
      costPriceInr: product.costPriceInr ?? 0,
      gstRate: product.gstRate ?? 18,
      hsnCode: product.hsnCode ?? '',
      imageUrl: product.primaryImageUrl || product.imageUrls?.[0] || '',
    });
  }

  const breakdown = computeAmountBreakdown(lineItems);
  if (breakdown.total > recipient.creditAmount) {
    throw new ApiError(
      422,
      `Order total ₹${breakdown.total} exceeds your credit of ₹${recipient.creditAmount}`,
      'CREDIT_EXCEEDED',
    );
  }

  const orderNumber = await nextOrderNumber();
  const order = await Order.create({
    tenantId: recipient.tenantId,
    campaignId: campaign._id,
    recipientId: recipient._id,
    orderNumber,
    items: lineItems,
    shippingAddress,
    amountBreakdown: breakdown,
    status: 'created',
    statusHistory: [{ status: 'created', at: new Date(), actorUserId: null, note: 'Redemption submit' }],
  });

  transitionRedemption(recipient, 'redeemed');
  transitionRedemption(recipient, 'order_created');
  await recipient.save();

  // §3.2 reservation hook — redemption consumes stock. Best-effort: an
  // inventory bookkeeping error must never block a recipient's order.
  try {
    const { applyInventoryTransaction } = await import('../catalog/inventory.service.js');
    for (const line of lineItems) {
      const product = await CatalogProduct.findById(line.catalogProductId);
      if (product?.inventory?.mode !== 'physical') continue;
      await applyInventoryTransaction({
        productId: line.catalogProductId,
        variantSku: line.sku,
        type: 'reduce',
        qty: line.qty,
        reason: `Redemption order ${order.orderNumber}`,
        relatedOrderId: order._id,
        relatedCampaignId: campaign._id,
        consumeReserved: product.inventory.reserved >= line.qty,
      });
    }
  } catch {
    // Stock drift is reconciled by catalog admins via /platform/inventory.
  }

  return { orderNumber: order.orderNumber, estimatedDelivery: '7-10 business days', orderId: String(order._id) };
}

export async function trackRedemption(token) {
  const recipient = await findRecipientByToken(token);
  const order = await Order.findOne({ recipientId: recipient._id, tenantId: recipient.tenantId });
  if (!order) throw new NotFoundError('No order found for this redemption');

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    amountBreakdown: order.amountBreakdown,
    items: sanitizeOrderItems(order.items),
    shippingAddress: order.shippingAddress,
    redemptionStatus: recipient.redemptionStatus,
  };
}
