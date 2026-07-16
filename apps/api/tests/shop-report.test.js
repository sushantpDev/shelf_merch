import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';
import { createApp } from '../src/app.js';
import { Tenant } from '../src/modules/tenants/tenant.model.js';
import { User } from '../src/modules/users/user.model.js';
import { RoleAssignment } from '../src/modules/roles/roleAssignment.model.js';
import { Shop } from '../src/modules/shops/shop.model.js';
import { Campaign } from '../src/modules/campaigns/campaign.model.js';
import { Recipient } from '../src/modules/campaigns/recipient.model.js';
import { Order } from '../src/modules/orders/order.model.js';
import { signAccessToken } from '../src/modules/auth/auth.service.js';

let app;
let tenant;
let otherTenant;
let admin;
let otherAdmin;
let shop;
let campaign;

const auth = (t) => ({ Authorization: `Bearer ${t}` });
const oid = () => new mongoose.Types.ObjectId();

async function makeAdmin(tenantId, name) {
  const user = await User.create({
    tenantId,
    name,
    email: `${name}-${Math.random().toString(36).slice(2)}@test.io`,
    status: 'active',
  });
  const assignment = await RoleAssignment.create({
    tenantId,
    userId: user._id,
    role: 'company_admin',
    scopeType: 'tenant',
  });
  return { user, token: signAccessToken(user, assignment) };
}

async function seedRecipient(status, creditAmount = 500) {
  return Recipient.create({
    tenantId: tenant._id,
    campaignId: campaign._id,
    name: 'R',
    email: `r${Math.random().toString(36).slice(2)}@t.io`,
    creditAmount,
    redemptionToken: `tok${Math.random().toString(36).slice(2)}`,
    redemptionStatus: status,
  });
}

async function seedOrder(recipient, total, items) {
  return Order.create({
    tenantId: tenant._id,
    campaignId: campaign._id,
    recipientId: recipient._id,
    orderNumber: `SM-${Math.floor(Math.random() * 1e7)}`,
    items,
    status: 'created',
    shippingAddress: { name: 'R', line1: 'x', city: 'c', state: 's', pincode: '500001' },
    amountBreakdown: { subtotal: total, serviceFee: 0, gst: 0, total },
  });
}

beforeAll(async () => {
  await connectTestDb();
  app = createApp();
});
afterAll(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  tenant = await Tenant.create({ name: 'Acme', slug: 'acme', status: 'active' });
  otherTenant = await Tenant.create({ name: 'Rubix', slug: 'rubix', status: 'active' });
  admin = await makeAdmin(tenant._id, 'AdminA');
  otherAdmin = await makeAdmin(otherTenant._id, 'AdminB');
  shop = await Shop.create({ tenantId: tenant._id, name: 'Rewards Hub', currencyMode: 'points' });
  campaign = await Campaign.create({
    tenantId: tenant._id,
    entityId: oid(),
    name: 'Diwali points',
    type: 'points',
    shopId: shop._id,
    status: 'redemption_open',
    createdBy: oid(),
  });
});

describe('shop report (Reports tab)', () => {
  it('aggregates KPIs, cumulative funnel, weekly orders and top products', async () => {
    await seedRecipient('invited', 500);
    await seedRecipient('opened', 500);
    const verified = await seedRecipient('verified', 500);
    const redeemed = await seedRecipient('order_created', 500);
    void verified;
    await seedOrder(redeemed, 800, [
      { name: 'Hoodie', qty: 1, unitPriceInr: 600 },
      { name: 'Mug', qty: 2, unitPriceInr: 100 },
    ]);

    const res = await request(app)
      .get(`/api/v1/shops/${shop._id}/report`)
      .set(auth(admin.token));
    expect(res.status).toBe(200);

    const { totals, funnel, weekly, topProducts } = res.body;
    expect(totals.campaignsLaunched).toBe(1);
    expect(totals.recipients).toBe(4);
    expect(totals.pointsIssuedInr).toBe(2000);
    expect(totals.pointsRedeemedInr).toBe(500);
    expect(totals.redemptionRate).toBe(25); // 1 of 4
    expect(totals.ordersCount).toBe(1);
    expect(totals.orderValueInr).toBe(800);
    expect(totals.avgOrderValueInr).toBe(800);

    // Cumulative stages: verified includes redeemed; opened includes both.
    const byStage = Object.fromEntries(funnel.map((f) => [f.stage, f]));
    expect(byStage.invited.count).toBe(4);
    expect(byStage.opened.count).toBe(3);
    expect(byStage.verified.count).toBe(2);
    expect(byStage.redeemed.count).toBe(1);
    expect(byStage.redeemed.pct).toBe(25);

    // 12 continuous weekly buckets; this week's bucket carries the order.
    expect(weekly).toHaveLength(12);
    expect(weekly.reduce((n, w) => n + w.orders, 0)).toBe(1);
    expect(weekly.at(-1).orders).toBe(1);
    expect(weekly.at(-1).valueInr).toBe(800);

    expect(topProducts[0]).toMatchObject({ name: 'Mug', qty: 2, valueInr: 200 });
    expect(topProducts[1]).toMatchObject({ name: 'Hoodie', qty: 1, valueInr: 600 });
  });

  it('returns an empty report for a shop with no campaigns', async () => {
    const bare = await Shop.create({ tenantId: tenant._id, name: 'Empty', currencyMode: 'inr' });
    const res = await request(app)
      .get(`/api/v1/shops/${bare._id}/report`)
      .set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.totals.recipients).toBe(0);
    expect(res.body.totals.ordersCount).toBe(0);
    expect(res.body.funnel).toHaveLength(0);
  });

  it("is tenant-isolated — another tenant's admin gets 404", async () => {
    const res = await request(app)
      .get(`/api/v1/shops/${shop._id}/report`)
      .set(auth(otherAdmin.token));
    expect(res.status).toBe(404);
  });
});
