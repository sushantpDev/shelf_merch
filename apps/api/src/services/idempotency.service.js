import { ensureRedisReady, getRedis } from '../config/redis.js';
import { IdempotencyKey } from '../modules/system/idempotencyKey.model.js';

/** §3.5 — replayed keys return the cached response for 24 hours. */
export const IDEMPOTENCY_TTL_SEC = 86400;
const PENDING_MARKER = '__pending__';

export function buildIdempotencyKey({ key, tenantId, userId }) {
  const tenantPart = tenantId == null ? '_' : String(tenantId);
  const userPart = userId == null ? '_' : String(userId);
  return `idempotency:${key}:${tenantPart}:${userPart}`;
}

async function beginRedis(scope) {
  const redisKey = buildIdempotencyKey(scope);
  const redis = getRedis();
  const reserved = await redis.set(redisKey, PENDING_MARKER, 'NX', 'EX', IDEMPOTENCY_TTL_SEC);
  if (reserved) return { action: 'proceed' };

  const raw = await redis.get(redisKey);
  if (raw === PENDING_MARKER) return { action: 'in_flight' };
  if (raw) {
    try {
      const { statusCode, response } = JSON.parse(raw);
      return { action: 'replay', statusCode, response };
    } catch {
      return { action: 'in_flight' };
    }
  }

  const retry = await redis.set(redisKey, PENDING_MARKER, 'NX', 'EX', IDEMPOTENCY_TTL_SEC);
  return retry ? { action: 'proceed' } : { action: 'in_flight' };
}

async function completeRedis(scope, { statusCode, response }) {
  const redisKey = buildIdempotencyKey(scope);
  await getRedis().set(redisKey, JSON.stringify({ statusCode, response }), 'EX', IDEMPOTENCY_TTL_SEC);
}

async function releaseRedis(scope) {
  await getRedis().del(buildIdempotencyKey(scope));
}

async function beginMongo(scope, meta) {
  const existing = await IdempotencyKey.findOne(scope);
  if (existing) {
    if (existing.response === null) return { action: 'in_flight' };
    return { action: 'replay', statusCode: existing.statusCode, response: existing.response };
  }

  try {
    await IdempotencyKey.create({ ...scope, ...meta });
    return { action: 'proceed' };
  } catch (err) {
    if (err.code === 11000) return { action: 'in_flight' };
    throw err;
  }
}

async function completeMongo(scope, { statusCode, response }) {
  await IdempotencyKey.updateOne(scope, { statusCode, response });
}

async function releaseMongo(scope) {
  await IdempotencyKey.deleteOne(scope);
}

export async function isIdempotencyStoreReady() {
  return ensureRedisReady();
}

/** Reserve or replay an idempotency key. Falls back to Mongo when Redis is down. */
export async function beginIdempotency(scope, meta = {}) {
  if (await isIdempotencyStoreReady()) return beginRedis(scope);
  return beginMongo(scope, meta);
}

export async function completeIdempotency(scope, result) {
  if (await isIdempotencyStoreReady()) return completeRedis(scope, result);
  return completeMongo(scope, result);
}

export async function releaseIdempotency(scope) {
  if (await isIdempotencyStoreReady()) return releaseRedis(scope);
  return releaseMongo(scope);
}
