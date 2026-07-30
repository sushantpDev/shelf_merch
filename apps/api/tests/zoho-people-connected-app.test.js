import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import {
  ZOHO_PEOPLE_EMBED_PATHS,
  ZOHO_PEOPLE_FRAME_ANCESTORS,
  isZohoPeopleEmbedPath,
  applyZohoPeopleEmbedHeaders,
} from '../src/middleware/zohoPeopleEmbed.middleware.js';

const FORBIDDEN_IN_HTML = [
  'ZOHO_CLIENT_SECRET',
  'client_secret',
  'access_token',
  'refresh_token',
  'oauth-code-test-secret',
  'TOKEN_ENCRYPTION_KEY',
];

describe('Zoho People Connected App embed routes', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  afterAll(() => {
    app = null;
  });

  it('recognises only the dedicated embed paths', () => {
    expect(isZohoPeopleEmbedPath('/zoho/people')).toBe(true);
    expect(isZohoPeopleEmbedPath('/zoho/people/sandbox')).toBe(true);
    expect(isZohoPeopleEmbedPath('/zoho/people/')).toBe(true);
    expect(isZohoPeopleEmbedPath('/app/integrations')).toBe(false);
    expect(isZohoPeopleEmbedPath('/')).toBe(false);
    expect(ZOHO_PEOPLE_EMBED_PATHS).toEqual(['/zoho/people', '/zoho/people/sandbox']);
  });

  it.each(ZOHO_PEOPLE_EMBED_PATHS)('%s returns 200 with Zoho frame-ancestors and no X-Frame-Options', async (path) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(200);
    expect(res.headers['x-frame-options']).toBeUndefined();

    const csp = String(res.headers['content-security-policy'] || '');
    expect(csp).toMatch(/frame-ancestors/i);
    for (const origin of ZOHO_PEOPLE_FRAME_ANCESTORS) {
      expect(csp).toContain(origin);
    }
    expect(csp).not.toMatch(/frame-ancestors[^;]*'none'/i);
    expect(csp).not.toMatch(/frame-ancestors[^;]*'self'/i);

    const body = String(res.text || '');
    for (const secret of FORBIDDEN_IN_HTML) {
      expect(body).not.toContain(secret);
    }
  });

  it('keeps frame protection on other ShelfMerch pages', async () => {
    const res = await request(app).get('/api/v1/health/live');
    expect(res.status).toBe(200);
    // Helmet default (test/non-production) still sets SAMEORIGIN / DENY on non-embed routes.
    const xfo = res.headers['x-frame-options'];
    expect(xfo).toBeTruthy();
    expect(String(xfo).toLowerCase()).toMatch(/sameorigin|deny/);

    const csp = String(res.headers['content-security-policy'] || '');
    // Embed allowlist must not leak onto unrelated routes.
    expect(csp).not.toContain('https://people.zoho.in');
    expect(csp).not.toContain('https://sigma.zoho.in');
  });

  it('applyZohoPeopleEmbedHeaders strips X-Frame-Options and sets allowlist', () => {
    const headers = new Map();
    const res = {
      removeHeader(name) {
        headers.delete(String(name).toLowerCase());
      },
      getHeader(name) {
        return headers.get(String(name).toLowerCase());
      },
      setHeader(name, value) {
        headers.set(String(name).toLowerCase(), value);
      },
    };
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; frame-ancestors 'none'",
    );
    applyZohoPeopleEmbedHeaders(res);
    expect(res.getHeader('X-Frame-Options')).toBeUndefined();
    const csp = res.getHeader('Content-Security-Policy');
    expect(csp).toContain('https://people.zoho.in');
    expect(csp).toContain('https://sigma.zoho.in');
    expect(csp).not.toMatch(/frame-ancestors[^;]*'none'/);
  });
});
