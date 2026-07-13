import { ensureRedisReady, getRedis } from '../config/redis.js';

/**
 * Per-process in-memory fallback used only for `critical` scopes when Redis is
 * unavailable, so brute-force protection on auth/OTP does not disappear during a
 * Redis outage (fail closed). It is deliberately best-effort: counters are not
 * shared across processes and reset on restart — a coarse safety net, not the
 * primary limiter.
 */
const memoryBuckets = new Map();

function sweepMemoryBuckets(now) {
  for (const [k, bucket] of memoryBuckets) {
    if (bucket.resetAt <= now) memoryBuckets.delete(k);
  }
}

export function consumeMemory({ key, limit, windowSec }) {
  const now = Date.now();
  // Bound memory: opportunistically evict expired windows when the map grows.
  if (memoryBuckets.size > 10_000) sweepMemoryBuckets(now);

  let bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowSec * 1000 };
    memoryBuckets.set(key, bucket);
  }
  bucket.count += 1;

  const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  if (bucket.count > limit) {
    return { allowed: false, remaining: 0, retryAfterSec, limit };
  }
  return { allowed: true, remaining: limit - bucket.count, retryAfterSec: 0, limit };
}

/**
 * Fixed-window counter. When Redis is unavailable, non-critical scopes fail open
 * (request allowed); scopes marked `critical` fall back to the in-memory limiter
 * above so login/OTP brute-force protection still applies.
 * @returns {Promise<{ allowed: boolean, remaining: number, retryAfterSec: number, limit: number }>}
 */
export async function consumeRateLimit({ key, limit, windowSec, critical = false }) {
  if (!(await ensureRedisReady())) {
    // Fall back to the in-memory limiter only for critical scopes, and never in
    // the test env (Redis is always "down" there, and the shared process-level
    // counters would otherwise throttle the suite's many auth calls).
    if (critical && process.env.NODE_ENV !== 'test') {
      return consumeMemory({ key, limit, windowSec });
    }
    return { allowed: true, remaining: limit, retryAfterSec: 0, limit };
  }

  const redis = getRedis();
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSec);

  const ttl = await redis.ttl(key);
  const retryAfterSec = ttl > 0 ? ttl : windowSec;

  if (count > limit) {
    return { allowed: false, remaining: 0, retryAfterSec, limit };
  }

  return { allowed: true, remaining: limit - count, retryAfterSec: 0, limit };
}

/** Checks scopes in order; stops at the first limit exceeded. */
export async function checkRateLimits(scopes) {
  let minRemaining = Infinity;

  for (const scope of scopes) {
    if (!scope.key) continue;
    const result = await consumeRateLimit(scope);
    if (!result.allowed) return result;
    minRemaining = Math.min(minRemaining, result.remaining);
  }

  return {
    allowed: true,
    remaining: Number.isFinite(minRemaining) ? minRemaining : 0,
    retryAfterSec: 0,
    limit: scopes[0]?.limit ?? 0,
  };
}
