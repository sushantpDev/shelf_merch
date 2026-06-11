import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';
import { createApp } from '../src/app.js';
import { Tenant } from '../src/modules/tenants/tenant.model.js';
import { User } from '../src/modules/users/user.model.js';
import { RoleAssignment } from '../src/modules/roles/roleAssignment.model.js';
import { Wallet } from '../src/modules/wallets/wallet.model.js';
import { Entity } from '../src/modules/entities/entity.model.js';
import { Shop } from '../src/modules/shops/shop.model.js';
import { Campaign } from '../src/modules/campaigns/campaign.model.js';
import { Recipient } from '../src/modules/campaigns/recipient.model.js';
import { Order } from '../src/modules/orders/order.model.js';
import { signAccessToken } from '../src/modules/auth/auth.service.js';

let app;
let tenant;
let entity1;
let entity2;
let adminToken;
let manager1Token;
let manager2Token;

beforeAll(async () => {
  await connectTestDb();
  app = createApp();
});
afterAll(disconnectTestDb);

beforeEach(async () => {
  await clearTestDb();
  tenant = await Tenant.create({ name: 'Rubix', slug: 'rubix' });
  const wallet = await Wallet.create({ tenantId: tenant._id, name: 'Budget' });
  entity1 = await Entity.create({ tenantId: tenant._id, walletId: wallet._id, name: 'Marketing' });
  entity2 = await Entity.create({ tenantId: tenant._id, walletId: wallet._id, name: 'Sales' });
  const shop = await Shop.create({ tenantId: tenant._id, name: 'Rubix Shop', status: 'live' });

  const admin = await User.create({
    tenantId: tenant._id,
    name: 'Admin',
    email: 'admin@test.io',
    status: 'active',
  });
  adminToken = signAccessToken(
    admin,
    await RoleAssignment.create({
      tenantId: tenant._id,
      userId: admin._id,
      role: 'company_admin',
      scopeType: 'tenant',
    }),
  );

  const mgr1 = await User.create({
    tenantId: tenant._id,
    name: 'Mgr1',
    email: 'mgr1@test.io',
    status: 'active',
  });
  manager1Token = signAccessToken(
    mgr1,
    await RoleAssignment.create({
      tenantId: tenant._id,
      userId: mgr1._id,
      role: 'entity_manager',
      scopeType: 'entity',
      scopeId: entity1._id,
      assignedEntityIds: [entity1._id],
    }),
  );

  const mgr2 = await User.create({
    tenantId: tenant._id,
    name: 'Mgr2',
    email: 'mgr2@test.io',
    status: 'active',
  });
  manager2Token = signAccessToken(
    mgr2,
    await RoleAssignment.create({
      tenantId: tenant._id,
      userId: mgr2._id,
      role: 'entity_manager',
      scopeType: 'entity',
      scopeId: entity2._id,
      assignedEntityIds: [entity2._id],
    }),
  );

  const campaign1 = await Campaign.create({
    tenantId: tenant._id,
    entityId: entity1._id,
    name: 'Diwali Gifts',
    type: 'points',
    shopId: shop._id,
    status: 'redemption_open',
    creditsPerRecipient: 1000,
    totalBudget: 1000,
    recipientCount: 1,
  });
  const campaign2 = await Campaign.create({
    tenantId: tenant._id,
    entityId: entity2._id,
    name: 'Sales Kits',
    type: 'points',
    shopId: shop._id,
    status: 'redemption_open',
    creditsPerRecipient: 500,
    totalBudget: 500,
    recipientCount: 1,
  });

  const recipient1 = await Recipient.create({
    tenantId: tenant._id,
    campaignId: campaign1._id,
    name: 'Alice',
    email: 'alice@test.io',
    creditAmount: 1000,
    redemptionToken: 'token1',
    redemptionStatus: 'order_created',
  });
  await Recipient.create({
    tenantId: tenant._id,
    campaignId: campaign2._id,
    name: 'Bob',
    email: 'bob@test.io',
    creditAmount: 500,
    redemptionToken: 'token2',
    redemptionStatus: 'order_created',
  });

  await Order.create({
    tenantId: tenant._id,
    campaignId: campaign1._id,
    recipientId: recipient1._id,
    orderNumber: 'SM-2026-000001',
    items: [{ name: 'Test Tee', qty: 1, unitPriceInr: 500 }],
    shippingAddress: { name: 'Alice', line1: '123 St', city: 'Hyderabad', state: 'TS', pincode: '500001' },
    amountBreakdown: { subtotal: 500, serviceFee: 0, gst: 90, total: 590 },
    status: 'created',
  });
});

describe('orders API (Phase 6)', () => {
  it('lists orders for company admin', async () => {
    const res = await request(app).get('/api/v1/orders').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].orderNumber).toBe('SM-2026-000001');
    expect(res.body.items[0].campaignName).toBe('Diwali Gifts');
  });

  it('entity manager only sees orders for assigned entity campaigns (ABAC)', async () => {
    const res1 = await request(app).get('/api/v1/orders').set('Authorization', `Bearer ${manager1Token}`);
    expect(res1.body.items).toHaveLength(1);
    expect(res1.body.items[0].campaignName).toBe('Diwali Gifts');

    const res2 = await request(app).get('/api/v1/orders').set('Authorization', `Bearer ${manager2Token}`);
    expect(res2.body.items).toHaveLength(0);
  });

  it('updates order status through state machine', async () => {
    const list = await request(app).get('/api/v1/orders').set('Authorization', `Bearer ${adminToken}`);
    const orderId = list.body.items[0]._id;

    const bad = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'shipped' });
    expect(bad.status).toBe(422);

    const ok = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved', note: 'Reviewed' });
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe('approved');
    expect(ok.body.validNextStatuses).toContain('mockup_pending');
  });

  it('entity manager cannot update order status', async () => {
    const list = await request(app).get('/api/v1/orders').set('Authorization', `Bearer ${manager1Token}`);
    const orderId = list.body.items[0]._id;
    const res = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${manager1Token}`)
      .send({ status: 'approved' });
    expect(res.status).toBe(403);
  });
});
