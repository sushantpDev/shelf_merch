import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';
import { createApp } from '../src/app.js';
import { Tenant } from '../src/modules/tenants/tenant.model.js';
import { User } from '../src/modules/users/user.model.js';
import { RoleAssignment } from '../src/modules/roles/roleAssignment.model.js';
import { Notification } from '../src/modules/notifications/notification.model.js';
import { signAccessToken } from '../src/modules/auth/auth.service.js';

let app;
let tenantA;
let tenantB;
let adminA; // company_admin of tenant A
let adminB; // company_admin of tenant B
let agent; // platform_support_agent

const auth = (t) => ({ Authorization: `Bearer ${t}` });

async function makeUser({ tenantId, name, role, scopeType }) {
  const user = await User.create({
    tenantId,
    name,
    email: `${name}-${Math.random().toString(36).slice(2)}@test.io`,
    status: 'active',
  });
  const assignment = await RoleAssignment.create({ tenantId, userId: user._id, role, scopeType });
  return { user, token: signAccessToken(user, assignment) };
}

/** Support notifications are fire-and-forget — poll briefly instead of racing them. */
async function eventually(assertFn, { timeout = 1500, step = 50 } = {}) {
  const deadline = Date.now() + timeout;
  for (;;) {
    try {
      return await assertFn();
    } catch (err) {
      if (Date.now() > deadline) throw err;
      await new Promise((r) => setTimeout(r, step));
    }
  }
}

beforeAll(async () => {
  await connectTestDb();
  app = createApp();
});
afterAll(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  tenantA = await Tenant.create({ name: 'Acme', slug: 'acme', status: 'active' });
  tenantB = await Tenant.create({ name: 'Rubix', slug: 'rubix', status: 'active' });
  adminA = await makeUser({ tenantId: tenantA._id, name: 'AdminA', role: 'company_admin', scopeType: 'tenant' });
  adminB = await makeUser({ tenantId: tenantB._id, name: 'AdminB', role: 'company_admin', scopeType: 'tenant' });
  agent = await makeUser({ tenantId: null, name: 'Agent', role: 'platform_support_agent', scopeType: 'platform' });
});

async function raiseTicket(subject = 'Order stuck in transit') {
  const res = await request(app)
    .post('/api/v1/support-tickets')
    .set(auth(adminA.token))
    .send({ subject, description: 'AWB shows no movement for a week', type: 'delivery_issue' });
  expect(res.status).toBe(201);
  return res.body;
}

describe('support feature end to end', () => {
  it('tenant raises a ticket, lists it, and support staff are notified in-app', async () => {
    const ticket = await raiseTicket();
    expect(ticket.status).toBe('open');
    expect(ticket.source).toBe('tenant');

    const mine = await request(app).get('/api/v1/support-tickets').set(auth(adminA.token));
    expect(mine.status).toBe(200);
    expect(mine.body.items).toHaveLength(1);
    expect(mine.body.items[0].subject).toBe('Order stuck in transit');

    await eventually(async () => {
      const pings = await Notification.find({ userId: agent.user._id, type: 'support_ticket' });
      expect(pings.length).toBe(1);
      expect(pings[0].title).toContain('Order stuck in transit');
    });
  });

  it('tenants are isolated: B sees no A tickets and cannot read them by id', async () => {
    const ticket = await raiseTicket();

    const listB = await request(app).get('/api/v1/support-tickets').set(auth(adminB.token));
    expect(listB.status).toBe(200);
    expect(listB.body.items).toHaveLength(0);

    const getB = await request(app)
      .get(`/api/v1/support-tickets/${ticket._id}`)
      .set(auth(adminB.token));
    expect(getB.status).toBe(404);

    const replyB = await request(app)
      .post(`/api/v1/support-tickets/${ticket._id}/messages`)
      .set(auth(adminB.token))
      .send({ body: 'sneaky' });
    expect(replyB.status).toBe(404);
  });

  it('platform queue lists the ticket with the tenant name resolved', async () => {
    await raiseTicket();
    const queue = await request(app)
      .get('/api/v1/platform/support-tickets')
      .set(auth(agent.token));
    expect(queue.status).toBe(200);
    expect(queue.body.items).toHaveLength(1);
    expect(queue.body.items[0].tenantName).toBe('Acme');
  });

  it('internal notes never reach the tenant; public replies do and notify the raiser', async () => {
    const ticket = await raiseTicket();

    const internalRes = await request(app)
      .post(`/api/v1/platform/support-tickets/${ticket._id}/messages`)
      .set(auth(agent.token))
      .send({ body: 'internal: courier lost it', internal: true });
    expect(internalRes.status).toBe(200);

    const publicRes = await request(app)
      .post(`/api/v1/platform/support-tickets/${ticket._id}/messages`)
      .set(auth(agent.token))
      .send({ body: 'We are shipping a replacement.' });
    expect(publicRes.status).toBe(200);

    const mine = await request(app)
      .get(`/api/v1/support-tickets/${ticket._id}`)
      .set(auth(adminA.token));
    expect(mine.status).toBe(200);
    expect(mine.body.messages).toHaveLength(1);
    expect(mine.body.messages[0].body).toBe('We are shipping a replacement.');
    expect(mine.body.messages[0].fromPlatform).toBe(true);
    expect(mine.body.messages[0].authorName).toBe('Agent');

    // The platform view keeps both, flagged.
    const full = await request(app)
      .get(`/api/v1/platform/support-tickets/${ticket._id}`)
      .set(auth(agent.token));
    expect(full.body.messages).toHaveLength(2);
    expect(full.body.tenantName).toBe('Acme');
    expect(full.body.raisedByName).toBe('AdminA');

    await eventually(async () => {
      const pings = await Notification.find({
        userId: adminA.user._id,
        type: 'support_ticket_update',
      });
      expect(pings.length).toBe(1);
      expect(pings[0].title).toContain('Support replied');
    });
  });

  it('tenant reply reopens a waiting ticket and pings the assigned agent', async () => {
    const ticket = await raiseTicket();

    // open → in_progress → waiting_on_customer
    await request(app)
      .patch(`/api/v1/platform/support-tickets/${ticket._id}/assign`)
      .set(auth(agent.token))
      .send({ userId: String(agent.user._id) })
      .expect(200);
    await request(app)
      .patch(`/api/v1/platform/support-tickets/${ticket._id}/status`)
      .set(auth(agent.token))
      .send({ status: 'waiting_on_customer' })
      .expect(200);

    const reply = await request(app)
      .post(`/api/v1/support-tickets/${ticket._id}/messages`)
      .set(auth(adminA.token))
      .send({ body: 'Still nothing delivered.' });
    expect(reply.status).toBe(200);
    expect(reply.body.status).toBe('in_progress');
    expect(reply.body.messages.at(-1).fromPlatform).toBe(false);
    expect(reply.body.messages.at(-1).authorName).toBe('AdminA');

    await eventually(async () => {
      const pings = await Notification.find({
        userId: agent.user._id,
        type: 'support_ticket_update',
      });
      expect(pings.length).toBeGreaterThanOrEqual(1);
      expect(pings.at(-1).title).toContain('Customer replied');
    });
  });

  it('closed tickets refuse tenant replies', async () => {
    const ticket = await raiseTicket();
    await request(app)
      .patch(`/api/v1/platform/support-tickets/${ticket._id}/status`)
      .set(auth(agent.token))
      .send({ status: 'closed' })
      .expect(200);

    const reply = await request(app)
      .post(`/api/v1/support-tickets/${ticket._id}/messages`)
      .set(auth(adminA.token))
      .send({ body: 'one more thing' });
    expect(reply.status).toBe(422);
    expect(reply.body.code ?? reply.body.error?.code).toBeDefined();
  });

  it('tenant list filter by status works and platform filters by tenant', async () => {
    await raiseTicket('First');
    await raiseTicket('Second');

    const open = await request(app)
      .get('/api/v1/support-tickets?status=open')
      .set(auth(adminA.token));
    expect(open.body.items).toHaveLength(2);

    const filtered = await request(app)
      .get(`/api/v1/platform/support-tickets?tenantId=${tenantB._id}`)
      .set(auth(agent.token));
    expect(filtered.body.items).toHaveLength(0);
  });
});
