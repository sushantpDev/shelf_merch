import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { withTimeout, CircuitBreaker, TimeoutError } from '../src/services/resilience.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe('resilience: withTimeout (Gap F)', () => {
  it('resolves a fast operation', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 50, 'fast')).resolves.toBe('ok');
  });

  it('rejects a slow operation with TimeoutError', async () => {
    await expect(withTimeout(sleep(100).then(() => 'late'), 20, 'slow')).rejects.toBeInstanceOf(TimeoutError);
  });
});

describe('resilience: CircuitBreaker (Gap F)', () => {
  it('opens after the failure threshold, short-circuits, then recovers', async () => {
    const breaker = new CircuitBreaker('test', { failureThreshold: 2, cooldownMs: 30, timeoutMs: 100 });
    const boom = () => Promise.reject(new Error('provider down'));

    await expect(breaker.run(boom)).rejects.toThrow('provider down');
    await expect(breaker.run(boom)).rejects.toThrow('provider down');
    expect(breaker.status.state).toBe('open');

    // While open, calls short-circuit without invoking the function.
    let called = false;
    await expect(
      breaker.run(() => {
        called = true;
        return Promise.resolve('x');
      }),
    ).rejects.toThrow(/is open/);
    expect(called).toBe(false);

    // After cooldown it half-opens; a success closes it.
    await sleep(40);
    await expect(breaker.run(() => Promise.resolve('recovered'))).resolves.toBe('recovered');
    expect(breaker.status.state).toBe('closed');
  });
});

describe('request context (Gap F)', () => {
  let app;
  beforeAll(() => {
    app = createApp();
  });

  it('stamps a generated X-Request-Id on the response', async () => {
    const res = await request(app).get('/api/v1/health/live');
    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('propagates an inbound X-Request-Id', async () => {
    const res = await request(app).get('/api/v1/health/live').set('X-Request-Id', 'trace-abc-123');
    expect(res.headers['x-request-id']).toBe('trace-abc-123');
  });
});
