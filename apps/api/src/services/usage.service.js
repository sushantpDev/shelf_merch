import { UsageCounter } from '../modules/usage/usage.model.js';
import { ensureRedisReady, getRedis } from '../config/redis.js';
import { logger } from '../config/logger.js';

/** Current UTC billing period, e.g. "2026-07". */
export function currentPeriod(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Fire-and-forget monthly business-event meter (orders, campaigns, imports, …).
 * Low frequency, so a Mongo $inc upsert per event is fine. Never throws.
 */
export function recordUsage(tenantId, metric, n = 1) {
  if (!tenantId || !metric) return;
  const period = currentPeriod();
  UsageCounter.updateOne(
    { tenantId, metric, period },
    { $inc: { value: n }, $setOnInsert: { tenantId, metric, period } },
    { upsert: true },
  ).catch((err) => logger.error({ err: err.message, metric }, 'usage meter write failed'));
}

/**
 * High-frequency raw request counter — Redis only, so there is no Mongo write on
 * the request path. Best-effort: silently skipped when Redis is unavailable.
 */
export async function recordRequest(tenantId) {
  try {
    if (!tenantId || !(await ensureRedisReady())) return;
    const key = `usage:req:${tenantId}:${currentPeriod()}`;
    const redis = getRedis();
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 40 * 24 * 60 * 60); // ~40d, spans the month
  } catch {
    /* metering is best-effort */
  }
}

/** Read a tenant's usage for a period: persisted business metrics + live request count. */
export async function getTenantUsage(tenantId, period = currentPeriod()) {
  const rows = await UsageCounter.find({ tenantId, period }).lean();
  const metrics = Object.fromEntries(rows.map((r) => [r.metric, r.value]));
  let requests = 0;
  try {
    if (await ensureRedisReady()) {
      requests = Number((await getRedis().get(`usage:req:${tenantId}:${period}`)) || 0);
    }
  } catch {
    /* ignore */
  }
  return { tenantId: String(tenantId), period, requests, metrics };
}
