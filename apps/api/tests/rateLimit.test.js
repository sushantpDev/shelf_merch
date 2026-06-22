import { describe, it, expect, vi, beforeEach } from 'vitest';

const redisMock = {
  incr: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
};

vi.mock('../src/config/redis.js', () => ({
  ensureRedisReady: vi.fn(),
  getRedis: () => redisMock,
}));

import { ensureRedisReady } from '../src/config/redis.js';
import { consumeRateLimit, checkRateLimits } from '../src/services/rateLimit.service.js';

describe('rateLimit service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisMock.incr.mockReset();
    redisMock.expire.mockReset();
    redisMock.ttl.mockReset();
  });

  it('allows requests when Redis is unavailable', async () => {
    ensureRedisReady.mockResolvedValue(false);
    const result = await consumeRateLimit({ key: 'ratelimit:test', limit: 5, windowSec: 60 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
    expect(redisMock.incr).not.toHaveBeenCalled();
  });

  it('blocks after the limit is exceeded', async () => {
    ensureRedisReady.mockResolvedValue(true);
    redisMock.incr.mockResolvedValue(6);
    redisMock.ttl.mockResolvedValue(120);

    const result = await consumeRateLimit({ key: 'ratelimit:login:ip:1.2.3.4', limit: 5, windowSec: 900 });
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSec).toBe(120);
    expect(result.remaining).toBe(0);
  });

  it('sets expiry on the first request in a window', async () => {
    ensureRedisReady.mockResolvedValue(true);
    redisMock.incr.mockResolvedValue(1);
    redisMock.ttl.mockResolvedValue(900);

    await consumeRateLimit({ key: 'ratelimit:login:ip:1.2.3.4', limit: 5, windowSec: 900 });
    expect(redisMock.expire).toHaveBeenCalledWith('ratelimit:login:ip:1.2.3.4', 900);
  });

  it('stops checking after the first exceeded scope', async () => {
    ensureRedisReady.mockResolvedValue(true);
    redisMock.incr.mockResolvedValueOnce(6);
    redisMock.ttl.mockResolvedValue(60);

    const result = await checkRateLimits([
      { key: 'ratelimit:login:ip:1.2.3.4', limit: 5, windowSec: 900 },
      { key: 'ratelimit:login:email:me@test.io', limit: 3, windowSec: 900 },
    ]);

    expect(result.allowed).toBe(false);
    expect(redisMock.incr).toHaveBeenCalledTimes(1);
  });
});
