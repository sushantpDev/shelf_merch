import pino from 'pino';
import { env } from './env.js';
import { getRequestContext } from './requestContext.js';

/**
 * §Gap F — structured logging with:
 *  - secret redaction (auth headers, cookies, tokens, passwords, OTP codes),
 *  - a mixin that stamps the current requestId/tenantId/userId onto every line
 *    (from AsyncLocalStorage), so logs across a request correlate.
 */
export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'authorization',
      '*.authorization',
      '*.password',
      '*.passwordHash',
      '*.newPassword',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
      '*.otp',
      '*.otpHash',
      '*.code',
      '*.secret',
    ],
    censor: '[redacted]',
  },
  mixin() {
    const ctx = getRequestContext();
    if (!ctx) return {};
    const out = {};
    if (ctx.requestId) out.requestId = ctx.requestId;
    if (ctx.tenantId) out.tenantId = String(ctx.tenantId);
    if (ctx.userId) out.userId = String(ctx.userId);
    return out;
  },
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } }
      : undefined,
});
