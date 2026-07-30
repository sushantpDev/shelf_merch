import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { DOCS_PUBLIC_ROUTES } from '../src/modules/docs/docs.controller.js';

const FORBIDDEN_IN_HTML = [
  'ZOHO_CLIENT_SECRET',
  'client_secret',
  'access_token',
  'refresh_token',
  'TOKEN_ENCRYPTION_KEY',
  'encryptedAccessToken',
  'encryptedRefreshToken',
];

describe('Zoho People public documentation pages', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  afterAll(() => {
    app = null;
  });

  it('registers the expected public documentation routes', () => {
    expect(DOCS_PUBLIC_ROUTES).toEqual([
      '/docs/zoho-people',
      '/docs/zoho-people/user-guide',
      '/docs/zoho-people/admin-guide',
      '/case-studies/zoho-people',
    ]);
  });

  it.each(DOCS_PUBLIC_ROUTES)('%s returns 200 without authentication', async (path) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(200);
    expect(String(res.headers['content-type'] || '')).toMatch(/html/i);
  });

  it.each(DOCS_PUBLIC_ROUTES)('%s contains product and support details', async (path) => {
    const res = await request(app).get(path);
    const body = String(res.text || '');
    expect(body).toContain('ShelfMerch for Zoho People');
    expect(body).toContain('support@shelfmerch.com');
    expect(body).toContain('Chitlu Innovations Private Limited');
  });

  it('labels the example workflow clearly and does not claim a real case study', async () => {
    const res = await request(app).get('/case-studies/zoho-people');
    const body = String(res.text || '');
    expect(body).toContain('Example Workflow');
    expect(body).toMatch(/does\s+<strong>not<\/strong>\s+represent a\s+specific customer result/i);
    expect(body).toContain('not a verified customer case study');
    expect(body).not.toMatch(/customer saved \d+%/i);
    expect(body).not.toMatch(/testimonial/i);
  });

  it('does not expose secrets, tokens, employee records, or env values', async () => {
    for (const path of DOCS_PUBLIC_ROUTES) {
      const res = await request(app).get(path);
      const body = String(res.text || '');
      for (const secret of FORBIDDEN_IN_HTML) {
        expect(body).not.toContain(secret);
      }
      expect(body).not.toMatch(/process\.env/);
      expect(body).not.toMatch(/mongodb(\+srv)?:\/\//i);
      expect(body).not.toContain('@employees.local');
    }
  });

  it('documents actual OAuth scopes and omits phone from Zoho sync claims on admin guide', async () => {
    const res = await request(app).get('/docs/zoho-people/admin-guide');
    const body = String(res.text || '');
    expect(body).toContain('ZOHOPEOPLE.forms.READ');
    expect(body).toContain('ZOHOPEOPLE.organization.READ');
    expect(body).toMatch(/Phone[\s\S]*not imported from Zoho/i);
  });

  it('keeps existing legal and health routes unchanged', async () => {
    const privacy = await request(app).get('/legal/privacy-policy');
    expect(privacy.status).toBe(200);
    const terms = await request(app).get('/legal/terms-of-service');
    expect(terms.status).toBe(200);
    const health = await request(app).get('/api/v1/health/live');
    expect(health.status).toBe(200);
  });
});
