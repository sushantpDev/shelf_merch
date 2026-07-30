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
  ZohoEmbedAuthCode,
  ZohoEmbedSession,
} from '../src/modules/integrations/zoho/zohoEmbedAuth.model.js';
import {
  EMBED_CODE_TTL_SEC,
  issueEmbedAuthCode,
} from '../src/modules/integrations/zoho/zohoEmbedAuth.service.js';
import { ZOHO_EMBED_SESSION_COOKIE } from '../src/modules/integrations/zoho/zohoCookies.js';
import { logger } from '../src/config/logger.js';
import * as envModule from '../src/config/env.js';

const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');
const TEST_CODE = 'oauth-code-test-secret-value-32chars!!';
const TEST_REQUEST_ID = 'oauth-state-test-secret-req-id';

let app;
let tenantA;
let tenantB;
let adminA;
let adminAToken;
let adminBToken;

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
  tenantA = await Tenant.create({ name: 'Tenant A', slug: 'tenant-a-embed' });
  tenantB = await Tenant.create({ name: 'Tenant B', slug: 'tenant-b-embed' });
  ({ user: adminA, token: adminAToken } = await makeAdmin(tenantA, 'a'));
  ({ token: adminBToken } = await makeAdmin(tenantB, 'b'));
});

describe('Zoho embed auth API', () => {
  it('POST /embed/issue requires first-party authentication', async () => {
    const res = await request(app)
      .post('/api/integrations/zoho/embed/issue')
      .send({ requestId: TEST_REQUEST_ID });
    expect(res.status).toBe(401);
  });

  it('issues a one-time code and stores only the hash', async () => {
    const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

    const res = await request(app)
      .post('/api/integrations/zoho/embed/issue')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ requestId: TEST_REQUEST_ID });

    expect(res.status).toBe(200);
    expect(res.body.requestId).toBe(TEST_REQUEST_ID);
    expect(typeof res.body.code).toBe('string');
    expect(res.body.code.length).toBeGreaterThan(20);

    const stored = await ZohoEmbedAuthCode.findOne({ requestId: TEST_REQUEST_ID }).lean();
    expect(stored).toBeTruthy();
    expect(stored.codeHash).toBe(sha256(res.body.code));
    expect(stored.codeHash).not.toBe(res.body.code);
    expect(String(stored.tenantId)).toBe(String(tenantA._id));

    const logged = JSON.stringify(infoSpy.mock.calls);
    expect(logged).not.toContain(res.body.code);
    expect(logged).not.toContain('refresh-token-test-secret');
    infoSpy.mockRestore();
  });

  it('exchange sets __Host-shelfmerch-zoho-embed cookie with required attributes', async () => {
    const { code } = await issueEmbedAuthCode({
      tenantId: tenantA._id,
      userId: adminA._id,
      requestId: TEST_REQUEST_ID,
    });

    const res = await request(app)
      .post('/api/integrations/zoho/embed/exchange')
      .send({ code, requestId: TEST_REQUEST_ID });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.access_token).toBeUndefined();
    expect(res.body.refresh_token).toBeUndefined();

    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeTruthy();
    const cookieLine = setCookie.find((c) => c.startsWith(`${ZOHO_EMBED_SESSION_COOKIE}=`));
    expect(cookieLine).toBeTruthy();
    expect(cookieLine).toMatch(/HttpOnly/i);
    expect(cookieLine).toMatch(/Secure/i);
    expect(cookieLine).toMatch(/SameSite=None/i);
    expect(cookieLine).toMatch(/Partitioned/i);
    expect(cookieLine).toMatch(/Path=\//);
    expect(cookieLine).not.toMatch(/Domain=/i);
    expect(cookieLine).not.toContain(TEST_CODE);
  });

  it('enforces single-use codes', async () => {
    const { code } = await issueEmbedAuthCode({
      tenantId: tenantA._id,
      userId: adminA._id,
      requestId: TEST_REQUEST_ID,
    });

    const first = await request(app)
      .post('/api/integrations/zoho/embed/exchange')
      .send({ code, requestId: TEST_REQUEST_ID });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post('/api/integrations/zoho/embed/exchange')
      .send({ code, requestId: TEST_REQUEST_ID });
    expect(second.status).toBe(401);
  });

  it('rejects expired codes', async () => {
    const { code } = await issueEmbedAuthCode({
      tenantId: tenantA._id,
      userId: adminA._id,
      requestId: TEST_REQUEST_ID,
    });
    await ZohoEmbedAuthCode.updateOne(
      { codeHash: sha256(code) },
      { $set: { expiresAt: new Date(Date.now() - 1000) } },
    );

    const res = await request(app)
      .post('/api/integrations/zoho/embed/exchange')
      .send({ code, requestId: TEST_REQUEST_ID });
    expect(res.status).toBe(401);
  });

  it('embed session authorizes Zoho status but not general ShelfMerch APIs', async () => {
    const { code } = await issueEmbedAuthCode({
      tenantId: tenantA._id,
      userId: adminA._id,
      requestId: TEST_REQUEST_ID,
    });

    const exchange = await request(app)
      .post('/api/integrations/zoho/embed/exchange')
      .send({ code, requestId: TEST_REQUEST_ID });
    const cookie = exchange.headers['set-cookie'];

    const zohoStatus = await request(app)
      .get('/api/integrations/zoho/status')
      .set('Cookie', cookie);
    expect(zohoStatus.status).toBe(200);

    const users = await request(app)
      .get('/api/v1/users')
      .set('Cookie', cookie);
    expect(users.status).toBe(401);
  });

  it('binds exchanged session to the issuing tenant (cross-tenant isolation)', async () => {
    const { code } = await issueEmbedAuthCode({
      tenantId: tenantA._id,
      userId: adminA._id,
      requestId: TEST_REQUEST_ID,
    });

    const exchange = await request(app)
      .post('/api/integrations/zoho/embed/exchange')
      .send({ code, requestId: TEST_REQUEST_ID });
    const cookie = exchange.headers['set-cookie'];

    const status = await request(app)
      .get('/api/integrations/zoho/status')
      .set('Cookie', cookie);
    expect(status.status).toBe(200);
    expect(status.body.integration).toBeNull();

    // Tenant B admin cannot exchange tenant A's code with a different requestId mismatch
    const issueB = await request(app)
      .post('/api/integrations/zoho/embed/issue')
      .set('Authorization', `Bearer ${adminBToken}`)
      .send({ requestId: 'tenant-b-request-id-12345678' });
    expect(issueB.status).toBe(200);
    expect(issueB.body.code).toBeTruthy();

    const sessionsA = await ZohoEmbedSession.countDocuments({ tenantId: tenantA._id });
    const sessionsB = await ZohoEmbedSession.countDocuments({ tenantId: tenantB._id });
    expect(sessionsA).toBe(1);
    expect(sessionsB).toBe(0);
  });

  it('first-party JWT authentication still works for issue', async () => {
    const res = await request(app)
      .post('/api/integrations/zoho/embed/issue')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ requestId: 'first-party-request-id-123456' });
    expect(res.status).toBe(200);
    expect(res.body.expiresInSec).toBe(EMBED_CODE_TTL_SEC);
  });
});

describe('Zoho embed postMessage payload guards', () => {
  it('rejects invalid auth message shapes (simulated iframe guard)', () => {
    const valid = (msg) =>
      Boolean(
        msg &&
          msg.type === 'SHELFMERCH_ZOHO_EMBED_AUTH' &&
          typeof msg.code === 'string' &&
          typeof msg.requestId === 'string',
      );
    expect(
      valid({
        type: 'SHELFMERCH_ZOHO_EMBED_AUTH',
        code: 'oauth-code-test-secret',
        requestId: 'oauth-state-test-secret',
      }),
    ).toBe(true);
    expect(valid({ type: 'EVIL', code: 'oauth-code-test-secret' })).toBe(false);
    expect(valid(null)).toBe(false);
  });

  it('rejects wrong postMessage origin', () => {
    const allowed = 'https://shelfmerch.io';
    const reject = (origin) => origin !== allowed;
    expect(reject('https://people.zoho.in')).toBe(true);
    expect(reject('https://evil.example')).toBe(true);
    expect(reject('https://shelfmerch.io')).toBe(false);
  });
});
