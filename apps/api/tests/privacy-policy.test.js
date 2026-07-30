import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const FORBIDDEN_IN_HTML = [
  'ZOHO_CLIENT_SECRET',
  'client_secret',
  'access_token',
  'refresh_token',
  'TOKEN_ENCRYPTION_KEY',
  'encryptedAccessToken',
  'encryptedRefreshToken',
];

describe('Privacy Policy public page', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  afterAll(() => {
    app = null;
  });

  it('GET /legal/privacy-policy returns 200 without authentication', async () => {
    const res = await request(app).get('/legal/privacy-policy');
    expect(res.status).toBe(200);
    expect(String(res.headers['content-type'] || '')).toMatch(/html/i);
  });

  it('contains company and support contact details', async () => {
    const res = await request(app).get('/legal/privacy-policy');
    expect(res.status).toBe(200);
    const body = String(res.text || '');
    expect(body).toContain('Chitlu Innovations Private Limited');
    expect(body).toContain('support@shelfmerch.com');
    expect(body).toContain('Last updated: 30 July 2026');
    expect(body).toContain('ShelfMerch for Zoho People');
  });

  it('does not expose OAuth tokens, secrets, employee records, or env values', async () => {
    const res = await request(app).get('/legal/privacy-policy');
    const body = String(res.text || '');
    for (const secret of FORBIDDEN_IN_HTML) {
      expect(body).not.toContain(secret);
    }
    expect(body).not.toMatch(/process\.env/);
    expect(body).not.toMatch(/mongodb(\+srv)?:\/\//i);
    // No sample employee PII payloads
    expect(body).not.toContain('@employees.local');
  });

  it('keeps authenticated API health route unchanged', async () => {
    const res = await request(app).get('/api/v1/health/live');
    expect(res.status).toBe(200);
  });
});
