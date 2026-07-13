import { ApiError } from '../utils/errors.js';
import { checkRateLimits } from '../services/rateLimit.service.js';

function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

/**
 * Redis-backed fixed-window rate limiter. Pass one or more scopes; every scope
 * must be under its limit for the request to proceed.
 */
export function rateLimit(scopes) {
  return async (req, res, next) => {
    const checks = scopes.map(({ prefix, limit, windowSec, key, critical = false }) => ({
      key: `ratelimit:${prefix}:${key(req)}`,
      limit,
      windowSec,
      critical,
    }));

    const result = await checkRateLimits(checks);
    if (!result.allowed) {
      res.set('Retry-After', String(result.retryAfterSec));
      res.set('X-RateLimit-Limit', String(result.limit));
      res.set('X-RateLimit-Remaining', '0');
      return next(
        new ApiError(429, 'Too many requests — try again later', 'RATE_LIMITED', {
          retryAfterSec: result.retryAfterSec,
        }),
      );
    }

    if (result.remaining !== undefined) {
      res.set('X-RateLimit-Remaining', String(result.remaining));
    }
    next();
  };
}

// Auth and OTP scopes are `critical`: they fall back to an in-memory limiter when
// Redis is down instead of failing open, so credential/OTP brute force stays
// throttled during a Redis outage.
export const loginRateLimit = rateLimit([
  { prefix: 'login:ip', limit: 20, windowSec: 15 * 60, key: clientIp, critical: true },
  { prefix: 'login:email', limit: 5, windowSec: 15 * 60, key: (req) => normalizeEmail(req.body?.email), critical: true },
]);

export const registerRateLimit = rateLimit([
  { prefix: 'register:ip', limit: 10, windowSec: 60 * 60, key: clientIp, critical: true },
]);

export const forgotPasswordRateLimit = rateLimit([
  { prefix: 'forgot:ip', limit: 10, windowSec: 60 * 60, key: clientIp, critical: true },
  { prefix: 'forgot:email', limit: 3, windowSec: 60 * 60, key: (req) => normalizeEmail(req.body?.email), critical: true },
]);

export const resetPasswordRateLimit = rateLimit([
  { prefix: 'reset:ip', limit: 10, windowSec: 60 * 60, key: clientIp, critical: true },
]);

export const sendOtpRateLimit = rateLimit([
  { prefix: 'otp:send:token', limit: 3, windowSec: 60 * 60, key: (req) => req.params?.token ?? '', critical: true },
  { prefix: 'otp:send:ip', limit: 20, windowSec: 60 * 60, key: clientIp, critical: true },
]);

export const verifyOtpRateLimit = rateLimit([
  { prefix: 'otp:verify:token', limit: 10, windowSec: 15 * 60, key: (req) => req.params?.token ?? '', critical: true },
  { prefix: 'otp:verify:ip', limit: 30, windowSec: 15 * 60, key: clientIp, critical: true },
]);

// Coarse per-IP ceiling for the whole API surface (defence against scraping and
// volumetric abuse). Non-critical: fails open when Redis is unavailable so a
// Redis outage never takes the whole API down.
export const globalRateLimit = rateLimit([
  { prefix: 'global:ip', limit: 600, windowSec: 60, key: clientIp },
]);
