import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';
import { createApp } from '../src/app.js';
import { Tenant } from '../src/modules/tenants/tenant.model.js';
import { User } from '../src/modules/users/user.model.js';
import { RoleAssignment } from '../src/modules/roles/roleAssignment.model.js';
import { signAccessToken } from '../src/modules/auth/auth.service.js';
import { seedChatFlow } from '../src/seed/seedChatFlow.js';

let app;
let token;

beforeAll(async () => {
  await connectTestDb();
  app = createApp();
});

afterAll(disconnectTestDb);

beforeEach(async () => {
  await clearTestDb();
  await seedChatFlow();
  const tenant = await Tenant.create({ name: 'Rubix', slug: 'rubix' });
  const user = await User.create({
    tenantId: tenant._id,
    name: 'Admin',
    email: `admin-${Date.now()}@test.io`,
    status: 'active',
  });
  const assignment = await RoleAssignment.create({
    tenantId: tenant._id,
    userId: user._id,
    role: 'company_admin',
    scopeType: 'tenant',
  });
  token = signAccessToken(user, assignment);
});

describe('guided chat widget API', () => {
  it('starts a new session at welcome and resumes existing session', async () => {
    const sessionId = randomUUID();

    const start = await request(app)
      .post('/api/v1/chat/session/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId });

    expect(start.status).toBe(201);
    expect(start.body.session.currentNodeId).toBe('welcome');
    expect(start.body.node.nodeId).toBe('welcome');
    expect(start.body.session.history.length).toBeGreaterThan(0);

    const resume = await request(app)
      .post('/api/v1/chat/session/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId });

    expect(resume.status).toBe(200);
    expect(resume.body.session.sessionId).toBe(sessionId);
    expect(resume.body.session.history).toHaveLength(start.body.session.history.length);
  });

  it('advances through sender shop setup to resolved end', async () => {
    const sessionId = randomUUID();
    await request(app)
      .post('/api/v1/chat/session/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId });

    const path = [
      { label: "I'm a Sender", next: 'sender_intro' },
      { label: 'Setting up a new shop', next: 'sender_shop_intro' },
      { label: 'I already have a shop', next: 'sender_shop_existing' },
      { label: 'Continue', next: 'sender_resolved_prompt' },
      { label: 'Yes', next: 'sender_resolved_end' },
    ];

    let last;
    for (const selectedOption of path) {
      last = await request(app)
        .post(`/api/v1/chat/session/${sessionId}/advance`)
        .set('Authorization', `Bearer ${token}`)
        .send({ selectedOption });
      expect(last.status).toBe(200);
    }

    expect(last.body.node.nodeId).toBe('sender_resolved_end');
    expect(last.body.node.isEndNode).toBe(true);
    expect(last.body.session.history.at(-1).sender).toBe('bot');
  });

  it('shop help node offers shop, existing shop, and kit actions', async () => {
    const res = await request(app)
      .get('/api/v1/chat/node/sender_shop_intro')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.options).toHaveLength(3);
    expect(res.body.options.map((o) => o.label)).toEqual([
      'I already have a shop',
      'Create shop',
      'Create a kit',
    ]);
    expect(res.body.options.find((o) => o.action === 'create_shop')).toBeTruthy();
    expect(res.body.options.find((o) => o.action === 'create_kit')).toBeTruthy();
  });

  it('shows carousel on recipient flow and supports handoff', async () => {
    const sessionId = randomUUID();
    await request(app)
      .post('/api/v1/chat/session/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId });

    const toCarousel = [
      { label: "I'm a Recipient", next: 'recipient_intro' },
      { label: 'I will redeem a gift', next: 'recipient_about_to_redeem' },
      { label: 'I need help redeeming my points', next: 'recipient_redemption_carousel' },
    ];

    for (const selectedOption of toCarousel) {
      const res = await request(app)
        .post(`/api/v1/chat/session/${sessionId}/advance`)
        .set('Authorization', `Bearer ${token}`)
        .send({ selectedOption });
      expect(res.status).toBe(200);
    }

    const carousel = await request(app)
      .get('/api/v1/chat/node/recipient_redemption_carousel')
      .set('Authorization', `Bearer ${token}`);

    expect(carousel.status).toBe(200);
    expect(carousel.body.responseType).toBe('carousel');
    expect(carousel.body.carouselItems.length).toBeGreaterThan(0);

    const handoff = await request(app)
      .post(`/api/v1/chat/session/${sessionId}/handoff`)
      .set('Authorization', `Bearer ${token}`);

    expect(handoff.status).toBe(200);
    expect(handoff.body.node.nodeId).toBe('human_handoff');
    expect(handoff.body.session.status).toBe('handed_off');
  });
});
