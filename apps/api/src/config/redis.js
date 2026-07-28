import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

let connection = null;
/** After a failed probe, skip reconnect attempts until this timestamp. */
let downUntil = 0;
const DOWN_COOLDOWN_MS = 5_000;

/** Lazy shared Redis connection (BullMQ requires maxRetriesPerRequest: null). */
export function getRedis() {
  if (!connection) {
    connection = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      connectTimeout: 3_000,
      retryStrategy: (times) => {
        // Slow the reconnect storm when Redis isn't running locally.
        if (times > 10) return Math.min(times * 200, 5_000);
        return Math.min(times * 100, 1_000);
      },
    });
    connection.on('error', (err) => {
      downUntil = Date.now() + DOWN_COOLDOWN_MS;
      logger.error({ err: err.message }, 'Redis error');
    });
    connection.on('ready', () => {
      downUntil = 0;
      logger.info('Redis connected');
    });
    connection.on('close', () => {
      downUntil = Date.now() + DOWN_COOLDOWN_MS;
    });
  }
  return connection;
}

/** Returns true when Redis is reachable; never blocks longer than `timeoutMs`. */
export async function ensureRedisReady(timeoutMs = 3_000) {
  if (Date.now() < downUntil) return false;

  const redis = getRedis();
  if (redis.status === 'ready') return true;
  // Avoid stacking connect() calls while a reconnect is already in flight.
  if (redis.status === 'connecting' || redis.status === 'reconnecting') return false;

  try {
    await Promise.race([
      redis.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis connect timeout')), timeoutMs),
      ),
    ]);
    if (redis.status === 'ready') {
      downUntil = 0;
      return true;
    }
  } catch {
    downUntil = Date.now() + DOWN_COOLDOWN_MS;
  }
  return false;
}

export async function closeRedis() {
  if (connection) {
    await connection.quit().catch(() => {});
    connection = null;
  }
  downUntil = 0;
}
