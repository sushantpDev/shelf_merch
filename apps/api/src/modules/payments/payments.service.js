import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env, razorpayConfigured } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { Payment } from './payment.model.js';
import { Wallet } from '../wallets/wallet.model.js';
import * as ledger from '../../services/ledger.service.js';
import { createInvoiceForPayment } from '../invoices/invoices.service.js';
import { notify } from '../notifications/notifications.service.js';
import { ApiError, NotFoundError } from '../../utils/errors.js';

function getRazorpay() {
  if (!razorpayConfigured()) {
    throw new ApiError(503, 'Razorpay is not configured', 'RAZORPAY_NOT_CONFIGURED');
  }
  return new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
}

/** §7.11 — create Razorpay order for wallet online funding. */
export async function createRazorpayOrder({ tenantId, userId, walletId, amountInr }) {
  if (amountInr < 1) throw new ApiError(422, 'Amount must be at least ₹1', 'INVALID_AMOUNT');

  const wallet = await Wallet.findOne({ _id: walletId, tenantId });
  if (!wallet) throw new NotFoundError('Wallet not found');

  const amountPaise = Math.round(amountInr * 100);
  const receipt = `wallet_${walletId}_${Date.now()}`;

  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    notes: {
      tenantId: String(tenantId),
      walletId: String(walletId),
      performedBy: String(userId),
      purpose: 'wallet_funding',
    },
  });

  const payment = await Payment.create({
    tenantId,
    relatedType: 'wallet_funding',
    relatedId: wallet._id,
    provider: 'razorpay',
    providerRefId: order.id,
    amount: amountInr,
    status: 'pending',
  });

  return {
    orderId: order.id,
    amount: amountInr,
    amountPaise,
    currency: 'INR',
    keyId: env.RAZORPAY_KEY_ID,
    paymentId: String(payment._id),
    walletId: String(wallet._id),
  };
}

export function verifyCheckoutSignature(orderId, paymentId, signature) {
  if (!env.RAZORPAY_KEY_SECRET) {
    throw new ApiError(503, 'Razorpay is not configured', 'RAZORPAY_NOT_CONFIGURED');
  }
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  if (expected !== signature) {
    throw new ApiError(400, 'Invalid Razorpay payment signature', 'INVALID_PAYMENT_SIGNATURE');
  }
}

/** Razorpay order for redemption checkout (points + UPI top-up). */
export async function createCampaignCheckoutOrder({ tenantId, recipientId, amountInr }) {
  if (amountInr < 1) throw new ApiError(422, 'Amount must be at least ₹1', 'INVALID_AMOUNT');

  const amountPaise = Math.round(amountInr * 100);
  const receipt = `redeem_${recipientId}_${Date.now()}`;

  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    notes: {
      tenantId: String(tenantId),
      recipientId: String(recipientId),
      purpose: 'redemption_checkout',
    },
  });

  const payment = await Payment.create({
    tenantId,
    relatedType: 'campaign_checkout',
    relatedId: recipientId,
    provider: 'razorpay',
    providerRefId: order.id,
    amount: amountInr,
    status: 'pending',
  });

  return {
    orderId: order.id,
    amount: amountInr,
    amountPaise,
    currency: 'INR',
    keyId: env.RAZORPAY_KEY_ID,
    paymentId: String(payment._id),
  };
}

/** Verify a captured Razorpay payment for redemption checkout. */
export async function verifyCampaignCheckoutPayment({
  tenantId,
  recipientId,
  expectedAmountInr,
  razorpayPayment,
}) {
  const { orderId, paymentId, signature } = razorpayPayment;
  verifyCheckoutSignature(orderId, paymentId, signature);

  const payment = await Payment.findOne({
    tenantId,
    relatedType: 'campaign_checkout',
    relatedId: recipientId,
    providerRefId: orderId,
    status: 'pending',
  }).setOptions({ skipTenantGuard: true });

  if (!payment) throw new NotFoundError('Payment not found');
  if (Math.abs(payment.amount - expectedAmountInr) > 0.01) {
    throw new ApiError(422, 'Payment amount does not match order balance', 'PAYMENT_AMOUNT_MISMATCH');
  }

  const razorpay = getRazorpay();
  const rzPayment = await razorpay.payments.fetch(paymentId);
  if (rzPayment.status !== 'captured') {
    throw new ApiError(422, 'Payment was not captured', 'PAYMENT_NOT_CAPTURED');
  }
  if (rzPayment.order_id !== orderId) {
    throw new ApiError(422, 'Payment order mismatch', 'PAYMENT_ORDER_MISMATCH');
  }
  if (rzPayment.amount !== Math.round(expectedAmountInr * 100)) {
    throw new ApiError(422, 'Payment amount does not match order balance', 'PAYMENT_AMOUNT_MISMATCH');
  }

  payment.providerRefId = paymentId;
  payment.status = 'succeeded';
  await payment.save();
  return payment;
}

export function verifyWebhookSignature(rawBody, signature) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    throw new ApiError(503, 'Webhook secret not configured', 'RAZORPAY_NOT_CONFIGURED');
  }
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  if (expected !== signature) {
    throw new ApiError(400, 'Invalid Razorpay webhook signature', 'INVALID_SIGNATURE');
  }
}

/**
 * §9.3 — trust webhook only. Idempotent: replayed payment_id returns existing result.
 */
export async function handleRazorpayWebhook(rawBody, signature) {
  verifyWebhookSignature(rawBody, signature);
  const event = JSON.parse(rawBody.toString());
  const eventType = event.event;

  if (eventType === 'payment.captured') {
    return processPaymentCaptured(event.payload.payment.entity, event);
  }
  if (eventType === 'payment.failed') {
    return processPaymentFailed(event.payload.payment.entity, event);
  }

  logger.info({ eventType }, 'Razorpay webhook ignored');
  return { handled: false, event: eventType };
}

async function processPaymentCaptured(entity, rawEvent) {
  const orderId = entity.order_id;
  const paymentId = entity.id;

  let payment = await Payment.findOne({ providerRefId: orderId, provider: 'razorpay' }).setOptions({
    skipTenantGuard: true,
  });
  if (!payment) {
    payment = await Payment.findOne({ providerRefId: paymentId, provider: 'razorpay' }).setOptions({
      skipTenantGuard: true,
    });
  }
  if (!payment) {
    logger.warn({ orderId, paymentId }, 'Payment record not found for webhook');
    return { handled: false, reason: 'payment_not_found' };
  }

  if (payment.status === 'succeeded') {
    return { handled: true, idempotent: true, paymentId: String(payment._id) };
  }

  const notes = entity.notes ?? {};
  const tenantId = payment.tenantId;
  const walletId = payment.relatedId;
  const performedBy = notes.performedBy ?? null;
  const amountInr = entity.amount / 100;

  payment.providerRefId = paymentId;
  payment.status = 'succeeded';
  payment.rawWebhookPayload = rawEvent;
  payment.amount = amountInr;
  await payment.save();

  await ledger.createTransaction({
    tenantId,
    walletId,
    type: 'fund_in',
    amount: amountInr,
    description: `Razorpay payment ${paymentId}`,
    performedBy,
  });

  const wallet = await Wallet.findOne({ _id: walletId, tenantId });
  if (wallet?.status === 'draft') {
    wallet.fundingMethod = 'online';
    wallet.fundingDocument.approvalStatus = 'approved';
    await wallet.save();
  }

  const invoice = await createInvoiceForPayment({ tenantId, payment });

  if (wallet?.ownerUserId) {
    await notify({
      type: 'wallet_funded',
      tenantId,
      userId: wallet.ownerUserId,
      title: 'Wallet funded successfully',
      body: `₹${amountInr.toLocaleString('en-IN')} added to ${wallet.name}.`,
      link: `/wallets/${wallet._id}`,
    });
  }

  return { handled: true, paymentId: String(payment._id), invoiceId: String(invoice._id) };
}

async function processPaymentFailed(entity, rawEvent) {
  const orderId = entity.order_id;
  const payment = await Payment.findOne({ providerRefId: orderId, provider: 'razorpay' }).setOptions({
    skipTenantGuard: true,
  });
  if (!payment) return { handled: false, reason: 'payment_not_found' };

  payment.status = 'failed';
  payment.rawWebhookPayload = rawEvent;
  await payment.save();

  const wallet = await Wallet.findOne({ _id: payment.relatedId, tenantId: payment.tenantId });
  if (wallet?.ownerUserId) {
    await notify({
      type: 'payment_failed',
      tenantId: payment.tenantId,
      userId: wallet.ownerUserId,
      title: 'Wallet payment failed',
      body: `Your payment of ₹${payment.amount} could not be processed. Please try again.`,
      link: `/wallets/${wallet._id}`,
    });
  }

  return { handled: true, status: 'failed' };
}
