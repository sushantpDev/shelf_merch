import { ensureRedisReady, getRedis } from '../config/redis.js';
import { consumeMemory } from './rateLimit.service.js';
import { recordRequest } from './usage.service.js';
import { Tenant } from '../modules/tenants/tenant.model.js';

const DEFAULT_RPM = 600;
const WINDOW_SEC = 60;
const CACHE_TTL_MS = 30_000;
const limitCache = new Map(); // tenantId -> { limit, expires }

async function tenantRequestsPerMinute(tenantId) {
  const cached = limitCache.get(String(tenantId));
  if (cached && cached.expires > Date.now()) return cached.limit;
  let limit = DEFAULT_RPM;
  try {
    const tenant = await Tenant.findOne({ _id: tenantId }).select('limits').lean();
    limit = tenant?.limits?.requestsPerMinute ?? DEFAULT_RPM;
  } catch {
    /* fail open to the default on a lookup error */
  }
  limitCache.set(String(tenantId), { limit, expires: Date.now() + CACHE_TTL_MS });
  return limit;
}

/**
 * Fixed-window per-tenant counter. Unlike the auth limiter this ALWAYS falls back
 * to the in-memory limiter when Redis is down (incl. test), so a single tenant
 * can never monopolise a replica even during a Redis outage.
 */
async function consumeTenantWindow(key, limit) {
  if (!(await ensureRedisReady())) {
    return consumeMemory({ key, limit, windowSec: WINDOW_SEC });
  }
  const redis = getRedis();
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, WINDOW_SEC);
  const ttl = await redis.ttl(key);
  const retryAfterSec = ttl > 0 ? ttl : WINDOW_SEC;
  if (count > limit) return { allowed: false, remaining: 0, retryAfterSec, limit };
  return { allowed: true, remaining: limit - count, retryAfterSec: 0, limit };
}

/**
 * §Gap E — noisy-neighbor ceiling + request metering, applied once per tenant
 * request from resolveTenant. Returns the quota result; metering is
 * fire-and-forget.
 */
export async function applyTenantGuardrails(tenantId) {
  recordRequest(tenantId); // fire-and-forget, never awaited on the request path
  const limit = await tenantRequestsPerMinute(tenantId);
  return consumeTenantWindow(`tenantquota:${tenantId}`, limit);
}

/** Test hook: drop the cached per-tenant limit so a freshly-set limit takes effect. */
export function clearTenantLimitCache(tenantId) {
  if (tenantId) limitCache.delete(String(tenantId));
  else limitCache.clear();
}
