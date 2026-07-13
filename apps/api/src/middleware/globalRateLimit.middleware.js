import rateLimit, { MemoryStore } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis } from '../config/redis.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 600;

/**
 * express-rate-limit store that keeps the coarse per-IP ceiling GLOBAL across
 * replicas by counting in Redis, but degrades to a per-process in-memory store
 * if Redis errors (fail-safe: still bounded, just not shared). express-rate-limit
 * 7.5.1 has no `passOnStoreError`, so the fallback is implemented here.
 */
class ResilientRedisStore {
  constructor() {
    this.redisStore = new RedisStore({
      prefix: 'ratelimit:global:',
      // ioredis: route raw commands through the shared connection.
      sendCommand: (...args) => getRedis().call(...args),
    });
    this.memoryStore = new MemoryStore();
    this.usingFallback = false;
  }

  init(options) {
    this.redisStore.init(options);
    this.memoryStore.init(options);
  }

  async #withFallback(method, ...args) {
    try {
      const result = await this.redisStore[method](...args);
      if (this.usingFallback) {
        this.usingFallback = false;
        logger.info('Global rate limiter: Redis store recovered');
      }
      return result;
    } catch (err) {
      if (!this.usingFallback) {
        this.usingFallback = true;
        logger.warn({ err: err.message }, 'Global rate limiter: Redis store error — using in-memory fallback');
      }
      return this.memoryStore[method](...args);
    }
  }

  increment(key) {
    return this.#withFallback('increment', key);
  }

  decrement(key) {
    return this.#withFallback('decrement', key);
  }

  resetKey(key) {
    return this.#withFallback('resetKey', key);
  }
}

/**
 * Coarse per-IP ceiling across the whole API as defence-in-depth in front of the
 * fine-grained per-identity limits on auth/OTP routes. Recognized by static
 * analysis (express-rate-limit) and shared across replicas (Redis store).
 * Skipped under test so the suite's many requests aren't throttled.
 */
export const globalHttpRateLimit = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_PER_WINDOW,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  store: env.NODE_ENV === 'test' ? undefined : new ResilientRedisStore(),
});
