import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';
import { ApiError } from '../utils/errors.js';

/** Key id + secret required for checkout orders. Webhook secret is separate. */
export function isRazorpayConfigured() {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

export function isRazorpayWebhookConfigured() {
  return Boolean(env.RAZORPAY_WEBHOOK_SECRET);
}

export function getRazorpayClient() {
  if (!isRazorpayConfigured()) {
    throw new ApiError(503, 'Razorpay is not configured', 'RAZORPAY_NOT_CONFIGURED');
  }
  return new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
}

/** Checkout handler signature: HMAC_SHA256(orderId|paymentId). */
export function verifyPaymentSignature(orderId, paymentId, signature) {
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
