import { ensureRedisReady, getRedis } from '../config/redis.js';

/**
 * Fixed-window counter. When Redis is unavailable, requests are allowed (fail open).
 * @returns {Promise<{ allowed: boolean, remaining: number, retryAfterSec: number, limit: number }>}
 */
export async function consumeRateLimit({ key, limit, windowSec }) {
  if (!(await ensureRedisReady())) {
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
