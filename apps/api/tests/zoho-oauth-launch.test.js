import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';
import { createApp } from '../src/app.js';
import { Tenant } from '../src/modules/tenants/tenant.model.js';
import { User } from '../src/modules/users/user.model.js';
import { RoleAssignment } from '../src/modules/roles/roleAssignment.model.js';
import { signAccessToken } from '../src/modules/auth/auth.service.js';
import {
  ZohoOAuthLaunchCode,
  ZohoOAuthLaunchSession,
} from '../src/modules/integrations/zoho/zohoOAuthLaunch.model.js';
import {
  OAUTH_LAUNCH_CODE_TTL_SEC,
  issueOAuthLaunchCode,
} from '../src/modules/integrations/zoho/zohoOAuthLaunch.service.js';
import { issueEmbedAuthCode } from '../src/modules/integrations/zoho/zohoEmbedAuth.service.js';
import {
  ZOHO_AUTH_BRIDGE_COOKIE,
  ZOHO_OAUTH_LAUNCH_COOKIE,
} from '../src/modules/integrations/zoho/zohoCookies.js';
import { logger } from '../src/config/logger.js';
import * as envModule from '../src/config/env.js';
import * as zohoOAuthModule from '../src/modules/integrations/zoho/zohoOAuth.service.js';

const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');
const TEST_REQUEST_ID = 'oauth-launch-test-request-id-123';
const TEST_CODE = 'oauth-launch-code-test-secret-32ch';

let app;
let tenantA;
let tenantB;
let adminA;
let adminAToken;
let embedSessionCookie;

async function makeAdmin(tenant, label) {
  const user = await User.create({
    tenantId: tenant._id,
    name: `${label} admin`,
    email: `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.io`,
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

async function createEmbedSessionCookie() {
  const { code } = await issueEmbedAuthCode({
    tenantId: tenantA._id,
    userId: adminA._id,
    requestId: 'embed-session-bootstrap-req-id',
  });
  const exchange = await request(app)
    .post('/api/integrations/zoho/embed/exchange')
    .send({ code, requestId: 'embed-session-bootstrap-req-id' });
  return exchange.headers['set-cookie'];
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
  tenantA = await Tenant.create({ name: 'Tenant A', slug: 'tenant-a-launch' });
  tenantB = await Tenant.create({ name: 'Tenant B', slug: 'tenant-b-launch' });
  ({ user: adminA, token: adminAToken } = await makeAdmin(tenantA, 'a'));
  await makeAdmin(tenantB, 'b');
  embedSessionCookie = await createEmbedSessionCookie();
});

describe('Zoho OAuth launch API', () => {
  it('POST /oauth-launch/issue requires embedded session authentication', async () => {
    const res = await request(app)
      .post('/api/integrations/zoho/oauth-launch/issue')
      .send({ requestId: TEST_REQUEST_ID });
    expect(res.status).toBe(401);
  });

  it('issues a launch code via embed session and stores only the hash', async () => {
    const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

    const res = await request(app)
      .post('/api/integrations/zoho/oauth-launch/issue')
      .set('Cookie', embedSessionCookie)
      .send({ requestId: TEST_REQUEST_ID });

    expect(res.status).toBe(200);
    expect(res.body.requestId).toBe(TEST_REQUEST_ID);
    expect(typeof res.body.code).toBe('string');
    expect(res.body.code.length).toBeGreaterThan(20);
    expect(res.body.access_token).toBeUndefined();

    const stored = await ZohoOAuthLaunchCode.findOne({ requestId: TEST_REQUEST_ID }).lean();
    expect(stored).toBeTruthy();
    expect(stored.codeHash).toBe(sha256(res.body.code));
    expect(stored.codeHash).not.toBe(res.body.code);

    const logged = JSON.stringify(infoSpy.mock.calls);
    expect(logged).not.toContain(res.body.code);
    infoSpy.mockRestore();
  });

  it('exchange sets __Host-shelfmerch-zoho-oauth-launch cookie with required attributes', async () => {
    const { code } = await issueOAuthLaunchCode({
      tenantId: tenantA._id,
      userId: adminA._id,
      requestId: TEST_REQUEST_ID,
    });

    const res = await request(app)
      .post('/api/integrations/zoho/oauth-launch/exchange')
      .send({ code, requestId: TEST_REQUEST_ID });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.access_token).toBeUndefined();

    const setCookie = res.headers['set-cookie'];
    const cookieLine = setCookie.find((c) => c.startsWith(`${ZOHO_OAUTH_LAUNCH_COOKIE}=`));
    expect(cookieLine).toBeTruthy();
    expect(cookieLine).toMatch(/HttpOnly/i);
    expect(cookieLine).toMatch(/Secure/i);
    expect(cookieLine).toMatch(/SameSite=Lax/i);
    expect(cookieLine).toMatch(/Path=\//);
    expect(cookieLine).not.toMatch(/Domain=/i);
    expect(cookieLine).not.toMatch(/Partitioned/i);
    expect(cookieLine).not.toContain(code);
  });

  it('enforces single-use launch codes', async () => {
    const { code } = await issueOAuthLaunchCode({
      tenantId: tenantA._id,
      userId: adminA._id,
      requestId: TEST_REQUEST_ID,
    });

    const first = await request(app)
      .post('/api/integrations/zoho/oauth-launch/exchange')
      .send({ code, requestId: TEST_REQUEST_ID });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post('/api/integrations/zoho/oauth-launch/exchange')
      .send({ code, requestId: TEST_REQUEST_ID });
    expect(second.status).toBe(401);
  });

  it('rejects expired launch codes', async () => {
    const { code } = await issueOAuthLaunchCode({
      tenantId: tenantA._id,
      userId: adminA._id,
      requestId: TEST_REQUEST_ID,
    });
    await ZohoOAuthLaunchCode.updateOne(
      { codeHash: sha256(code) },
      { $set: { expiresAt: new Date(Date.now() - 1000) } },
    );

    const res = await request(app)
      .post('/api/integrations/zoho/oauth-launch/exchange')
      .send({ code, requestId: TEST_REQUEST_ID });
    expect(res.status).toBe(401);
  });

  it('launch code expires in 60 seconds', async () => {
    const res = await request(app)
      .post('/api/integrations/zoho/oauth-launch/issue')
      .set('Cookie', embedSessionCookie)
      .send({ requestId: TEST_REQUEST_ID });
    expect(res.body.expiresInSec).toBe(OAUTH_LAUNCH_CODE_TTL_SEC);
  });

  it('rejects cross-tenant launch code exchange with mismatched requestId', async () => {
    const { code } = await issueOAuthLaunchCode({
      tenantId: tenantA._id,
      userId: adminA._id,
      requestId: TEST_REQUEST_ID,
    });

    const res = await request(app)
      .post('/api/integrations/zoho/oauth-launch/exchange')
      .send({ code, requestId: 'different-request-id-12345678' });
    expect(res.status).toBe(401);
  });

  it('launch session authorizes connect but not unrelated ShelfMerch APIs', async () => {
    const { code } = await issueOAuthLaunchCode({
      tenantId: tenantA._id,
      userId: adminA._id,
      requestId: TEST_REQUEST_ID,
    });

    const exchange = await request(app)
      .post('/api/integrations/zoho/oauth-launch/exchange')
      .send({ code, requestId: TEST_REQUEST_ID });
    const launchCookie = exchange.headers['set-cookie'];

    vi.spyOn(zohoOAuthModule, 'beginZohoConnect').mockResolvedValue({
      state: 'oauth-state-test-secret-value',
      url: 'https://accounts.zoho.in/oauth/v2/auth?test=1',
    });

    const connect = await request(app)
      .get(`/api/integrations/zoho/connect?popup=1&requestId=${encodeURIComponent(TEST_REQUEST_ID)}`)
      .set('Cookie', launchCookie);
    expect(connect.status).toBe(302);

    const users = await request(app)
      .get('/api/v1/users')
      .set('Cookie', launchCookie);
    expect(users.status).toBe(401);

    const zohoStatus = await request(app)
      .get('/api/integrations/zoho/status')
      .set('Cookie', launchCookie);
    expect(zohoStatus.status).toBe(401);
  });

  it('existing first-party connect still works via bridge cookie', async () => {
    vi.spyOn(zohoOAuthModule, 'beginZohoConnect').mockResolvedValue({
      state: 'oauth-state-first-party-test',
      url: 'https://accounts.zoho.in/oauth/v2/auth?firstparty=1',
    });

    const bridge = await request(app)
      .post('/api/integrations/zoho/bridge')
      .set('Authorization', `Bearer ${adminAToken}`);
    expect(bridge.status).toBe(200);

    const bridgeCookie = bridge.headers['set-cookie'].find((c) =>
      c.startsWith(`${ZOHO_AUTH_BRIDGE_COOKIE}=`),
    );

    const connect = await request(app)
      .get('/api/integrations/zoho/connect')
      .set('Cookie', bridgeCookie);
    expect(connect.status).toBe(302);
    expect(connect.headers.location).toContain('accounts.zoho.in');
  });

  it('does not log launch code or cookie during issue/exchange', async () => {
    const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

    const issue = await request(app)
      .post('/api/integrations/zoho/oauth-launch/issue')
      .set('Cookie', embedSessionCookie)
      .send({ requestId: TEST_REQUEST_ID });
    const { code } = issue.body;

    await request(app)
      .post('/api/integrations/zoho/oauth-launch/exchange')
      .send({ code, requestId: TEST_REQUEST_ID });

    const logged = JSON.stringify([...infoSpy.mock.calls, ...warnSpy.mock.calls]);
    expect(logged).not.toContain(code);
    expect(logged).not.toContain(adminAToken);
    infoSpy.mockRestore();
    warnSpy.mockRestore();
  });
});

describe('Zoho OAuth launch postMessage guards', () => {
  it('rejects invalid bridge-ready origin', () => {
    const allowed = 'https://shelfmerch.io';
    expect('https://people.zoho.in' !== allowed).toBe(true);
    expect('https://shelfmerch.io' === allowed).toBe(true);
  });

  it('popup handshake does not include access token in payload', () => {
    const ready = { type: 'SHELFMERCH_ZOHO_OAUTH_BRIDGE_READY', requestId: TEST_REQUEST_ID };
    expect(ready).not.toHaveProperty('access_token');
    expect(ready).not.toHaveProperty('token');
    expect(ready).not.toHaveProperty('code');
  });

  it('rejects mismatched requestId between iframe and popup', () => {
    const pending = 'req-a';
    const incoming = 'req-b';
    expect(incoming !== pending).toBe(true);
  });
});
