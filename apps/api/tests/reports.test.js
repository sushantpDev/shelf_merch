import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';
import { createApp } from '../src/app.js';
import { Tenant } from '../src/modules/tenants/tenant.model.js';
import { User } from '../src/modules/users/user.model.js';
import { RoleAssignment } from '../src/modules/roles/roleAssignment.model.js';
import mongoose from 'mongoose';
import { Order } from '../src/modules/orders/order.model.js';
import { Recipient } from '../src/modules/campaigns/recipient.model.js';
import { signAccessToken } from '../src/modules/auth/auth.service.js';
import { computeSnapshot } from '../src/modules/reports/reports.service.js';

let app;
let tenant;

async function platformToken(role = 'platform_super_admin') {
  const user = await User.create({ tenantId: null, name: role, email: `${role}-${Math.random()}@test.io`, status: 'active' });
  const assignment = await RoleAssignment.create({ tenantId: null, userId: user._id, role, scopeType: 'platform' });
  return signAccessToken(user, assignment);
}

const oid = () => new mongoose.Types.ObjectId();

async function seedOrder(total, items, status = 'created') {
  const campaignId = oid();
  const recipient = await Recipient.create({
    tenantId: tenant._id, campaignId, name: 'R', email: `r${Math.random()}@t.io`,
    creditAmount: 1000, redemptionToken: `t${Math.random().toString(36).slice(2)}`, redemptionStatus: 'order_created',
  });
  return Order.create({
    tenantId: tenant._id, campaignId, recipientId: recipient._id,
    orderNumber: `SM-${Math.floor(Math.random() * 1e6)}`, items, status,
    shippingAddress: { name: 'R', line1: 'x', city: 'c', state: 's', pincode: '500001' },
    amountBreakdown: { subtotal: total, serviceFee: 0, gst: 0, total },
  });
}

const auth = (t) => ({ Authorization: `Bearer ${t}` });

beforeAll(async () => {
  await connectTestDb();
  app = createApp();
});
afterAll(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  tenant = await Tenant.create({ name: 'Acme', slug: 'acme', status: 'active' });
});

describe('analytics read-model (Gap G)', () => {
  it('computeSnapshot aggregates GMV, margin, order status and redemption funnel', async () => {
    await seedOrder(1000, [{ name: 'Tee', qty: 2, unitPriceInr: 500, costPriceInr: 200 }], 'created');
    await seedOrder(600, [{ name: 'Mug', qty: 1, unitPriceInr: 600, costPriceInr: 250 }], 'shipped');

    const snap = await computeSnapshot();
    expect(snap.metrics.gmvInr).toBe(1600);
    // margin = (500-200)*2 + (600-250)*1 = 600 + 350
    expect(snap.metrics.marginInr).toBe(950);
    expect(snap.metrics.ordersCount).toBe(2);
    expect(snap.metrics.ordersByStatus.created).toBe(1);
    expect(snap.metrics.ordersByStatus.shipped).toBe(1);
    expect(snap.metrics.redemptionFunnel.order_created).toBe(2);
  });

  it('summary reads the snapshot; recompute refreshes it (no live OLTP on read)', async () => {
    const token = await platformToken();

    // Before any compute: stale placeholder, no heavy aggregation on the read path.
    const before = await request(app).get('/api/v1/platform/reports/summary').set(auth(token));
    expect(before.status).toBe(200);
    expect(before.body.computedAt).toBeNull();

    await seedOrder(2000, [{ name: 'Hoodie', qty: 1, unitPriceInr: 2000, costPriceInr: 900 }]);
    const recomputed = await request(app).post('/api/v1/platform/reports/recompute').set(auth(token)).send({});
    expect(recomputed.status).toBe(201);
    expect(recomputed.body.metrics.gmvInr).toBe(2000);

    const after = await request(app).get('/api/v1/platform/reports/summary').set(auth(token));
    expect(after.status).toBe(200);
    expect(after.body.metrics.gmvInr).toBe(2000);
    expect(after.body.computedAt).toBeTruthy();
  });

  it('denies non-platform users', async () => {
    const user = await User.create({ tenantId: tenant._id, name: 'T', email: `t${Math.random()}@t.io`, status: 'active' });
    const assignment = await RoleAssignment.create({ tenantId: tenant._id, userId: user._id, role: 'company_admin', scopeType: 'tenant' });
    const token = signAccessToken(user, assignment);
    const res = await request(app).get('/api/v1/platform/reports/summary').set(auth(token));
    expect(res.status).toBe(403);
  });
});
