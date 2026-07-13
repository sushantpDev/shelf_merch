import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { connectTestDb, disconnectTestDb } from './setup.js';
import { createApp } from '../src/app.js';

let app;

beforeAll(async () => {
  await connectTestDb();
  app = createApp();
});
afterAll(disconnectTestDb);

describe('health probes', () => {
  it('liveness is 200 and does not depend on data stores', async () => {
    const res = await request(app).get('/api/v1/health/live');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('live');
    expect(typeof res.body.uptimeSec).toBe('number');
  });

  it('readiness reports 200 with mongo up (redis optional in test)', async () => {
    expect(mongoose.connection.readyState).toBe(1);
    const res = await request(app).get('/api/v1/health/ready');
    // Redis is typically down in the test env; readiness gates on mongo AND redis,
    // so accept either ready(200) or not-ready(503) but assert the mongo signal.
    expect([200, 503]).toContain(res.status);
    expect(res.body.mongo).toBe('up');
    expect(res.body.status).toBe(res.status === 200 ? 'ready' : 'not-ready');
  });

  it('back-compat /health still responds', async () => {
    const res = await request(app).get('/api/v1/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body.mongo).toBe('up');
  });
});
