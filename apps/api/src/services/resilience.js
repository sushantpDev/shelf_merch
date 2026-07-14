import { logger } from '../config/logger.js';

/**
 * §Gap F — resilience primitives (no dependencies): a timeout wrapper and a
 * circuit breaker, so one slow/broken external provider (Razorpay, MSG91, S3)
 * can't exhaust a replica's event loop or hammer a failing dependency.
 */
export class TimeoutError extends Error {
  constructor(label, ms) {
    super(`${label} timed out after ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

export function withTimeout(promise, ms, label = 'operation') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(label, ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const STATE = { CLOSED: 'closed', OPEN: 'open', HALF_OPEN: 'half-open' };

export class CircuitBreaker {
  constructor(name, { failureThreshold = 5, cooldownMs = 30_000, timeoutMs = 10_000 } = {}) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
    this.timeoutMs = timeoutMs;
    this.state = STATE.CLOSED;
    this.failures = 0;
    this.openedAt = 0;
  }

  #canAttempt() {
    if (this.state !== STATE.OPEN) return true;
    if (Date.now() - this.openedAt >= this.cooldownMs) {
      this.state = STATE.HALF_OPEN; // allow a single trial call
      return true;
    }
    return false;
  }

  #onSuccess() {
    this.failures = 0;
    if (this.state !== STATE.CLOSED) {
      this.state = STATE.CLOSED;
      logger.info({ breaker: this.name }, 'circuit closed');
    }
  }

  #onFailure() {
    this.failures += 1;
    if (this.state === STATE.HALF_OPEN || this.failures >= this.failureThreshold) {
      this.state = STATE.OPEN;
      this.openedAt = Date.now();
      logger.warn({ breaker: this.name, failures: this.failures }, 'circuit opened');
    }
  }

  async run(fn) {
    if (!this.#canAttempt()) {
      throw new Error(`Circuit "${this.name}" is open`);
    }
    try {
      const result = await withTimeout(Promise.resolve().then(fn), this.timeoutMs, this.name);
      this.#onSuccess();
      return result;
    } catch (err) {
      this.#onFailure();
      throw err;
    }
  }

  get status() {
    return { name: this.name, state: this.state, failures: this.failures };
  }
}

const breakers = new Map();

export function breakerFor(name, opts) {
  if (!breakers.has(name)) breakers.set(name, new CircuitBreaker(name, opts));
  return breakers.get(name);
}

/** Guard an external call with a named circuit breaker + timeout. */
export function callExternal(name, fn, opts) {
  return breakerFor(name, opts).run(fn);
}

export function breakerStatuses() {
  return [...breakers.values()].map((b) => b.status);
}
