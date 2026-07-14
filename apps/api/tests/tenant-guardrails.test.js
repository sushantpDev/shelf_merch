import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';
import { createApp } from '../src/app.js';
import { Tenant } from '../src/modules/tenants/tenant.model.js';
import { User } from '../src/modules/users/user.model.js';
import { RoleAssignment } from '../src/modules/roles/roleAssignment.model.js';
import { signAccessToken } from '../src/modules/auth/auth.service.js';
import { recordUsage, getTenantUsage } from '../src/services/usage.service.js';
import { clearTenantLimitCache } from '../src/services/tenantGuardrails.service.js';

let app;

async function makeTenantUser(tenant) {
  const user = await User.create({
    tenantId: tenant._id,
    name: 'Admin',
    email: `admin-${tenant.slug}-${Math.random().toString(36).slice(2)}@test.io`,
    status: 'active',
  });
  const assignment = await RoleAssignment.create({
    tenantId: tenant._id,
    userId: user._id,
    role: 'company_admin',
    scopeType: 'tenant',
  });
  return signAccessToken(user, assignment);
}

const auth = (t) => ({ Authorization: `Bearer ${t}` });

beforeAll(async () => {
  await connectTestDb();
  app = createApp();
});
afterAll(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  clearTenantLimitCache();
});

describe('per-tenant quota (Gap E)', () => {
  it('throttles a noisy tenant with 429 without affecting a different tenant', async () => {
    const noisy = await Tenant.create({
      name: 'Noisy',
      slug: 'noisy',
      status: 'active',
      limits: { requestsPerMinute: 2 },
    });
    const calm = await Tenant.create({ name: 'Calm', slug: 'calm', status: 'active' });
    const noisyToken = await makeTenantUser(noisy);
    const calmToken = await makeTenantUser(calm);

    // Noisy tenant: 2 allowed, the 3rd trips the per-tenant ceiling.
    const r1 = await request(app).get('/api/v1/shops').set(auth(noisyToken));
    const r2 = await request(app).get('/api/v1/shops').set(auth(noisyToken));
    const r3 = await request(app).get('/api/v1/shops').set(auth(noisyToken));
    expect(r1.status).not.toBe(429);
    expect(r2.status).not.toBe(429);
    expect(r3.status).toBe(429);
    expect(r3.body.error.code).toBe('TENANT_QUOTA_EXCEEDED');
    expect(Number(r3.headers['retry-after'])).toBeGreaterThan(0);

    // A different tenant is unaffected by the noisy one's exhaustion.
    const other = await request(app).get('/api/v1/shops').set(auth(calmToken));
    expect(other.status).not.toBe(429);
  });
});

describe('usage metering (Gap E)', () => {
  it('records business events and surfaces them on the platform usage endpoint', async () => {
    const tenant = await Tenant.create({ name: 'Acme', slug: 'acme', status: 'active' });
    recordUsage(tenant._id, 'orders.created', 3);
    recordUsage(tenant._id, 'campaigns.launched', 1);
    // recordUsage is fire-and-forget; give the upserts a tick to land.
    await new Promise((r) => setTimeout(r, 50));

    const usage = await getTenantUsage(tenant._id);
    expect(usage.metrics['orders.created']).toBe(3);
    expect(usage.metrics['campaigns.launched']).toBe(1);
    expect(usage.period).toMatch(/^\d{4}-\d{2}$/);
  });
});
