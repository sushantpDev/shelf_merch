import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';
import { createApp } from '../src/app.js';
import { Tenant } from '../src/modules/tenants/tenant.model.js';
import { User } from '../src/modules/users/user.model.js';
import { RoleAssignment } from '../src/modules/roles/roleAssignment.model.js';
import { Notification } from '../src/modules/notifications/notification.model.js';
import { Recipient } from '../src/modules/campaigns/recipient.model.js';
import { signAccessToken } from '../src/modules/auth/auth.service.js';
import { signRedemptionSession } from '../src/modules/redemptions/redemptions.service.js';
import { getSupportTicketDetail } from '../src/modules/support/support.service.js';

let app;
let tenant;
let recipient; // verified employee
let otherRecipient; // second employee in the same tenant
let session;
let otherSession;
let agent; // platform_support_agent

const bearer = (t) => ({ Authorization: `Bearer ${t}` });
const base = () => `/api/v1/redemptions/${recipient.redemptionToken}/support-tickets`;

async function makeRecipient(name) {
  return Recipient.create({
    tenantId: tenant._id,
    campaignId: new mongoose.Types.ObjectId(),
    name,
    email: `${name.toLowerCase()}-${Math.random().toString(36).slice(2)}@corp.io`,
    creditAmount: 1000,
    redemptionToken: `tok-${name}-${Math.random().toString(36).slice(2)}`,
    redemptionStatus: 'verified',
  });
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
  tenant = await Tenant.create({ name: 'Acme', slug: 'acme', status: 'active' });
  recipient = await makeRecipient('Priya');
  otherRecipient = await makeRecipient('Rahul');
  session = signRedemptionSession(recipient);
  otherSession = signRedemptionSession(otherRecipient);

  const user = await User.create({
    tenantId: null,
    name: 'Agent',
    email: `agent-${Math.random().toString(36).slice(2)}@shelfmerch.io`,
    status: 'active',
  });
  const assignment = await RoleAssignment.create({
    tenantId: null,
    userId: user._id,
    role: 'platform_support_agent',
    scopeType: 'platform',
  });
  agent = { user, token: signAccessToken(user, assignment) };
});

async function raiseTicket(subject = 'Gift not delivered') {
  const res = await request(app)
    .post(base())
    .set(bearer(session))
    .send({ subject, description: 'Courier shows no movement', type: 'delivery_issue' });
  expect(res.status).toBe(201);
  return res.body;
}

describe('employee (recipient) support end to end', () => {
  it('requires a redemption session', async () => {
    const noAuth = await request(app).post(base()).send({ subject: 'x' });
    expect(noAuth.status).toBe(401);

    // A session minted for a different recipient must not work on this link.
    const wrongSession = await request(app).get(base()).set(bearer(otherSession));
    expect(wrongSession.status).toBe(401);
  });

  it('raises a ticket, lists it, and notifies the support desk', async () => {
    const ticket = await raiseTicket();
    expect(ticket.source).toBe('recipient');
    expect(String(ticket.relatedRecipientId)).toBe(String(recipient._id));
    expect(ticket.raisedByUserId).toBeNull();

    const mine = await request(app).get(base()).set(bearer(session));
    expect(mine.status).toBe(200);
    expect(mine.body.items).toHaveLength(1);
    expect(mine.body.items[0].subject).toBe('Gift not delivered');

    await eventually(async () => {
      const pings = await Notification.find({ userId: agent.user._id, type: 'support_ticket' });
      expect(pings.length).toBe(1);
      expect(pings[0].title).toContain('Gift not delivered');
    });
  });

  it('recipients are isolated from each other', async () => {
    const ticket = await raiseTicket();

    const otherList = await request(app)
      .get(`/api/v1/redemptions/${otherRecipient.redemptionToken}/support-tickets`)
      .set(bearer(otherSession));
    expect(otherList.status).toBe(200);
    expect(otherList.body.items).toHaveLength(0);

    const reply = await request(app)
      .post(
        `/api/v1/redemptions/${otherRecipient.redemptionToken}/support-tickets/${ticket._id}/messages`,
      )
      .set(bearer(otherSession))
      .send({ body: 'sneaky' });
    expect(reply.status).toBe(404);
  });

  it('internal notes stay hidden; public replies show and email the employee', async () => {
    const ticket = await raiseTicket();

    await request(app)
      .post(`/api/v1/platform/support-tickets/${ticket._id}/messages`)
      .set(bearer(agent.token))
      .send({ body: 'internal: check courier SLA', internal: true })
      .expect(200);
    await request(app)
      .post(`/api/v1/platform/support-tickets/${ticket._id}/messages`)
      .set(bearer(agent.token))
      .send({ body: 'A replacement is on its way.' })
      .expect(200);

    const mine = await request(app).get(base()).set(bearer(session));
    const visible = mine.body.items[0].messages;
    expect(visible).toHaveLength(1);
    expect(visible[0].body).toBe('A replacement is on its way.');
    expect(visible[0].fromPlatform).toBe(true);
  });

  it('employee reply reopens a waiting ticket and is attributed to them', async () => {
    const ticket = await raiseTicket();
    await request(app)
      .patch(`/api/v1/platform/support-tickets/${ticket._id}/status`)
      .set(bearer(agent.token))
      .send({ status: 'in_progress' })
      .expect(200);
    await request(app)
      .patch(`/api/v1/platform/support-tickets/${ticket._id}/status`)
      .set(bearer(agent.token))
      .send({ status: 'waiting_on_customer' })
      .expect(200);

    const reply = await request(app)
      .post(`${base()}/${ticket._id}/messages`)
      .set(bearer(session))
      .send({ body: 'Still nothing arrived.' });
    expect(reply.status).toBe(200);
    expect(reply.body.status).toBe('in_progress');
    expect(reply.body.messages.at(-1).fromPlatform).toBe(false);
    expect(reply.body.messages.at(-1).authorName).toBe('Priya');
  });

  it('closed tickets refuse employee replies', async () => {
    const ticket = await raiseTicket();
    await request(app)
      .patch(`/api/v1/platform/support-tickets/${ticket._id}/status`)
      .set(bearer(agent.token))
      .send({ status: 'closed' })
      .expect(200);

    const reply = await request(app)
      .post(`${base()}/${ticket._id}/messages`)
      .set(bearer(session))
      .send({ body: 'one more thing' });
    expect(reply.status).toBe(422);
  });

  it('platform detail resolves the employee as the raiser', async () => {
    const ticket = await raiseTicket();
    const detail = await getSupportTicketDetail(ticket._id);
    expect(detail.tenantName).toBe('Acme');
    expect(detail.raisedByName).toBe('Priya');
    expect(detail.raisedByEmail).toBe(recipient.email);
  });
});
