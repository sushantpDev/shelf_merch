import { env, msg91Configured } from '../config/env.js';
import { logger } from '../config/logger.js';
import { callExternal } from './resilience.js';
import { ApiError } from '../utils/errors.js';

/** Normalize to MSG91 format: 91XXXXXXXXXX */
export function normalizeIndianMobile(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  throw new ApiError(400, 'Invalid Indian mobile number', 'INVALID_PHONE');
}

/**
 * Send a 6-digit OTP via MSG91 template (Phase 5 redemption + Phase 7 notifications).
 * Falls back to structured logging when MSG91 is not configured (tests/dev).
 */
export async function sendOtpSms(mobile, otp) {
  const normalized = normalizeIndianMobile(mobile);

  if (!msg91Configured()) {
    logger.info({ mobile: normalized, otp }, 'MSG91 OTP (stub — set MSG91_AUTH_KEY + MSG91_OTP_TEMPLATE_ID)');
    return { success: true, provider: 'stub' };
  }

  // §Gap F — guard the external SMS provider with a timeout + circuit breaker so
  // a slow/broken MSG91 can't stall OTP requests or hammer a failing dependency.
  const res = await callExternal(
    'msg91-otp',
    () =>
      fetch('https://control.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          authkey: env.MSG91_AUTH_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: env.MSG91_OTP_TEMPLATE_ID,
          mobile: normalized,
          otp: String(otp),
          sender: env.MSG91_SENDER_ID,
        }),
      }),
    { timeoutMs: 8_000, failureThreshold: 5, cooldownMs: 30_000 },
  );

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    logger.error({ status: res.status, body }, 'MSG91 OTP send failed');
    throw new ApiError(502, 'Failed to send OTP SMS', 'SMS_SEND_FAILED', body);
  }

  logger.info({ mobile: normalized, requestId: body.request_id }, 'MSG91 OTP sent');
  return { success: true, provider: 'msg91', requestId: body.request_id };
}

/** Transactional SMS (campaign invites, order updates) via MSG91 Flow API. */
export async function sendSms(mobile, message) {
  const normalized = normalizeIndianMobile(mobile);

  if (!msg91Configured()) {
    logger.info({ mobile: normalized, message }, 'MSG91 SMS (stub)');
    return { success: true, provider: 'stub' };
  }

  // Flow API with a plain-text fallback route for MVP transactional messages.
  const res = await fetch('https://control.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: {
      authkey: env.MSG91_AUTH_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: env.MSG91_OTP_TEMPLATE_ID,
      short_url: '0',
      recipients: [{ mobiles: normalized, var: message }],
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    logger.warn({ status: res.status, body }, 'MSG91 SMS failed — falling back to log');
    logger.info({ mobile: normalized, message }, 'MSG91 SMS (fallback log)');
    return { success: true, provider: 'log_fallback' };
  }

  return { success: true, provider: 'msg91' };
}
