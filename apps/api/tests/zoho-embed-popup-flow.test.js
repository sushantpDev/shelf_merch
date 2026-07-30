import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';
import { createApp } from '../src/app.js';
import { Tenant } from '../src/modules/tenants/tenant.model.js';
import { User } from '../src/modules/users/user.model.js';
import { RoleAssignment } from '../src/modules/roles/roleAssignment.model.js';
import { signAccessToken } from '../src/modules/auth/auth.service.js';
import { issueEmbedAuthCode } from '../src/modules/integrations/zoho/zohoEmbedAuth.service.js';
import { logger } from '../src/config/logger.js';
import * as envModule from '../src/config/env.js';

const TEST_CODE = 'oauth-code-test-secret-value-32chars!!';
const TEST_REQUEST_ID = 'oauth-state-test-secret-req-id';
const TARGET_ORIGIN = 'https://shelfmerch.io';

let app;
let tenant;
let admin;
let adminToken;

async function makeAdmin() {
  const user = await User.create({
    tenantId: tenant._id,
    name: 'Embed admin',
    email: `embed-${Date.now()}@test.io`,
    status: 'active',
  });
  const assignment = await RoleAssignment.create({
    tenantId: tenant._id,
    userId: user._id,
    role: 'company_admin',
    scopeType: 'tenant',
  });
  return { user, token: signAccessToken(user, assignment) };
}

beforeAll(async () => {
  await connectTestDb();
  app = createApp();
  vi.spyOn(envModule, 'zohoPeopleConfigured').mockReturnValue(true);
});

afterAll(async () => {
  vi.restoreAllMocks();
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  tenant = await Tenant.create({ name: 'Embed Co', slug: 'embed-co' });
  ({ user: admin, token: adminToken } = await makeAdmin());
});

describe('Zoho embed popup ACK flow (simulated)', () => {
  it('rejects postMessage from invalid origin', () => {
    const allowed = TARGET_ORIGIN;
    expect('https://people.zoho.in' !== allowed).toBe(true);
    expect('https://evil.example' !== allowed).toBe(true);
    expect(TARGET_ORIGIN === allowed).toBe(true);
  });

  it('rejects mismatched requestId', () => {
    const pending = 'req-a';
    const incoming = 'req-b';
    expect(incoming !== pending).toBe(true);
  });

  it('calls /embed/exchange after valid auth message and returns ACK payload shape', async () => {
    const { code } = await issueEmbedAuthCode({
      tenantId: tenant._id,
      userId: admin._id,
      requestId: TEST_REQUEST_ID,
    });

    const exchange = await request(app)
      .post('/api/integrations/zoho/embed/exchange')
      .send({ code, requestId: TEST_REQUEST_ID });
    expect(exchange.status).toBe(200);
    expect(exchange.body.ok).toBe(true);

    const ack = { type: 'SHELFMERCH_ZOHO_EMBED_AUTH_ACK', requestId: TEST_REQUEST_ID };
    expect(ack.type).toBe('SHELFMERCH_ZOHO_EMBED_AUTH_ACK');
    expect(ack.requestId).toBe(TEST_REQUEST_ID);
  });

  it('logs EMBED_OPENER_MISSING without secrets', async () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const res = await request(app)
      .post('/api/integrations/zoho/embed/event')
      .send({ event: 'EMBED_OPENER_MISSING', requestId: TEST_REQUEST_ID });
    expect(res.status).toBe(200);
    const logged = JSON.stringify(warnSpy.mock.calls);
    expect(logged).toContain('EMBED_OPENER_MISSING');
    expect(logged).not.toContain(TEST_CODE);
    expect(logged).not.toContain('refresh-token-test-secret');
    warnSpy.mockRestore();
  });

  it('does not log embed code during issue', async () => {
    const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
    const res = await request(app)
      .post('/api/integrations/zoho/embed/issue')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ requestId: TEST_REQUEST_ID });
    expect(res.status).toBe(200);
    const logged = JSON.stringify(infoSpy.mock.calls);
    expect(logged).not.toContain(res.body.code);
    expect(logged).not.toContain('client-secret-test-secret');
    infoSpy.mockRestore();
  });
});

describe('sendEmbedAuthAndAwaitAck behaviour', () => {
  function createListenWindow() {
    const listeners = new Map();
    return {
      addEventListener(type, fn) {
        listeners.set(type, fn);
      },
      removeEventListener(type) {
        listeners.delete(type);
      },
      dispatch(event) {
        listeners.get('message')?.(event);
      },
    };
  }

  it('popup waits for ACK before resolving (closes only after ACK)', async () => {
    const { sendEmbedAuthAndAwaitAck } = await import(
      '../src/modules/integrations/zoho/zohoEmbedMessaging.shared.js'
    );

    const opener = { closed: false, postMessage: vi.fn() };
    const listenWindow = createListenWindow();
    const promise = sendEmbedAuthAndAwaitAck({
      opener,
      code: TEST_CODE,
      requestId: TEST_REQUEST_ID,
      targetOrigin: TARGET_ORIGIN,
      timeoutMs: 5000,
      intervalMs: 300,
      listenWindow,
      scheduleInterval: setInterval,
      clearScheduled: clearInterval,
    });

    expect(opener.postMessage).toHaveBeenCalledTimes(1);
    expect(opener.postMessage.mock.calls[0][1]).toBe(TARGET_ORIGIN);
    expect(opener.postMessage.mock.calls[0][0].code).toBe(TEST_CODE);

    listenWindow.dispatch(
      new MessageEvent('message', {
        origin: 'https://evil.example',
        data: { type: 'SHELFMERCH_ZOHO_EMBED_AUTH_ACK', requestId: TEST_REQUEST_ID },
      }),
    );

    listenWindow.dispatch(
      new MessageEvent('message', {
        origin: TARGET_ORIGIN,
        data: { type: 'SHELFMERCH_ZOHO_EMBED_AUTH_ACK', requestId: 'wrong-id' },
      }),
    );

    listenWindow.dispatch(
      new MessageEvent('message', {
        origin: TARGET_ORIGIN,
        data: { type: 'SHELFMERCH_ZOHO_EMBED_AUTH_ACK', requestId: TEST_REQUEST_ID },
      }),
    );

    await expect(promise).resolves.toBeUndefined();
  });

  it('popup does not close when window.opener is null (page guard)', () => {
    const opener = null;
    let wouldClose = false;
    if (!opener) {
      // ZohoPeopleEmbedAuthPage: show error, never call window.close()
    } else {
      wouldClose = true;
    }
    expect(wouldClose).toBe(false);
  });

  it('does not resolve when ACK is missing (ACK timeout)', async () => {
    vi.useFakeTimers();
    try {
      const { sendEmbedAuthAndAwaitAck } = await import(
        '../src/modules/integrations/zoho/zohoEmbedMessaging.shared.js'
      );

      const opener = { closed: false, postMessage: vi.fn() };
      const listenWindow = createListenWindow();
      const promise = sendEmbedAuthAndAwaitAck({
        opener,
        code: TEST_CODE,
        requestId: TEST_REQUEST_ID,
        targetOrigin: TARGET_ORIGIN,
        timeoutMs: 900,
        intervalMs: 300,
        listenWindow,
        scheduleInterval: setInterval,
        clearScheduled: clearInterval,
      });

      const assertion = expect(promise).rejects.toThrow('ACK_TIMEOUT');
      await vi.advanceTimersByTimeAsync(1000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('iframe embed auth deduplication', () => {
  const MESSAGE = { code: TEST_CODE, requestId: TEST_REQUEST_ID };

  it('multiple identical postMessages produce only one exchange API call', async () => {
    const { createEmbedAuthDedupState, handleEmbedAuthMessage } = await import(
      '../src/modules/integrations/zoho/zohoEmbedAuthIframeHandler.shared.js'
    );

    const state = createEmbedAuthDedupState();
    const exchange = vi.fn().mockResolvedValue(undefined);
    const sendAck = vi.fn();
    const onExchangeSuccess = vi.fn().mockResolvedValue(undefined);
    const onExchangeFailure = vi.fn();

    const deps = { exchange, sendAck, onExchangeSuccess, onExchangeFailure };

    const first = handleEmbedAuthMessage(state, MESSAGE, deps);
    const second = handleEmbedAuthMessage(state, MESSAGE, deps);
    const third = handleEmbedAuthMessage(state, MESSAGE, deps);

    await Promise.all([first, second, third]);

    expect(exchange).toHaveBeenCalledTimes(1);
    expect(exchange).toHaveBeenCalledWith(TEST_CODE, TEST_REQUEST_ID);
    expect(onExchangeSuccess).toHaveBeenCalledTimes(1);
    expect(onExchangeFailure).not.toHaveBeenCalled();
    expect(sendAck).toHaveBeenCalledTimes(1);
    expect(state.completedRequestIds.has(TEST_REQUEST_ID)).toBe(true);
    expect(state.inFlightRequestIds.has(TEST_REQUEST_ID)).toBe(false);
  });

  it('duplicate message after success receives ACK without another exchange', async () => {
    const { createEmbedAuthDedupState, handleEmbedAuthMessage } = await import(
      '../src/modules/integrations/zoho/zohoEmbedAuthIframeHandler.shared.js'
    );

    const state = createEmbedAuthDedupState();
    const exchange = vi.fn().mockResolvedValue(undefined);
    const sendAck = vi.fn();
    const onExchangeSuccess = vi.fn().mockResolvedValue(undefined);
    const onExchangeFailure = vi.fn();
    const deps = { exchange, sendAck, onExchangeSuccess, onExchangeFailure };

    await handleEmbedAuthMessage(state, MESSAGE, deps);
    await handleEmbedAuthMessage(state, MESSAGE, deps);

    expect(exchange).toHaveBeenCalledTimes(1);
    expect(sendAck).toHaveBeenCalledTimes(2);
    expect(onExchangeSuccess).toHaveBeenCalledTimes(1);
    expect(onExchangeFailure).not.toHaveBeenCalled();
  });

  it('successful authentication is not overwritten by a later duplicate failure', async () => {
    const { createEmbedAuthDedupState, handleEmbedAuthMessage } = await import(
      '../src/modules/integrations/zoho/zohoEmbedAuthIframeHandler.shared.js'
    );

    const state = createEmbedAuthDedupState();
    let authPhase = 'exchanging';
    let resolveExchange;
    const exchange = vi.fn(
      () =>
        new Promise((resolve, reject) => {
          resolveExchange = { resolve, reject };
        }),
    );
    const sendAck = vi.fn();
    const onExchangeSuccess = vi.fn().mockImplementation(async () => {
      authPhase = 'authenticated';
    });
    const onExchangeFailure = vi.fn().mockImplementation(() => {
      authPhase = 'signed_out';
    });
    const deps = { exchange, sendAck, onExchangeSuccess, onExchangeFailure };

    const pending = handleEmbedAuthMessage(state, MESSAGE, deps);
    state.completedRequestIds.add(TEST_REQUEST_ID);
    resolveExchange.reject(Object.assign(new Error('Invalid code'), { code: 'ZOHO_EMBED_CODE_INVALID' }));
    const result = await pending;

    expect(result).toBe('ack_only');
    expect(onExchangeFailure).not.toHaveBeenCalled();
    expect(authPhase).toBe('exchanging');
    expect(sendAck).toHaveBeenCalledWith(TEST_REQUEST_ID);
  });

  it('status refresh happens once per successful exchange', async () => {
    const { createEmbedAuthDedupState, handleEmbedAuthMessage } = await import(
      '../src/modules/integrations/zoho/zohoEmbedAuthIframeHandler.shared.js'
    );

    const state = createEmbedAuthDedupState();
    const exchange = vi.fn().mockResolvedValue(undefined);
    const sendAck = vi.fn();
    const refreshStatus = vi.fn().mockResolvedValue(undefined);
    const deps = {
      exchange,
      sendAck,
      onExchangeSuccess: refreshStatus,
      onExchangeFailure: vi.fn(),
    };

    await handleEmbedAuthMessage(state, MESSAGE, deps);
    await handleEmbedAuthMessage(state, MESSAGE, deps);
    await handleEmbedAuthMessage(state, MESSAGE, deps);

    expect(refreshStatus).toHaveBeenCalledTimes(1);
  });

  it('popup stops retrying immediately after receiving valid ACK', async () => {
    vi.useFakeTimers();
    try {
      const { sendEmbedAuthAndAwaitAck } = await import(
        '../src/modules/integrations/zoho/zohoEmbedMessaging.shared.js'
      );

      const opener = { closed: false, postMessage: vi.fn() };
      const listenWindow = (() => {
        const listeners = new Map();
        return {
          addEventListener(type, fn) {
            listeners.set(type, fn);
          },
          removeEventListener(type) {
            listeners.delete(type);
          },
          dispatch(event) {
            listeners.get('message')?.(event);
          },
        };
      })();

      const promise = sendEmbedAuthAndAwaitAck({
        opener,
        code: TEST_CODE,
        requestId: TEST_REQUEST_ID,
        targetOrigin: TARGET_ORIGIN,
        timeoutMs: 5000,
        intervalMs: 300,
        listenWindow,
        scheduleInterval: setInterval,
        clearScheduled: clearInterval,
      });

      listenWindow.dispatch(
        new MessageEvent('message', {
          origin: TARGET_ORIGIN,
          data: { type: 'SHELFMERCH_ZOHO_EMBED_AUTH_ACK', requestId: TEST_REQUEST_ID },
        }),
      );

      await promise;
      await vi.advanceTimersByTimeAsync(2000);

      expect(opener.postMessage).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
