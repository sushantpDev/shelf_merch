import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import {
  ZOHO_PEOPLE_COOP_PATHS,
  ZOHO_PEOPLE_IFRAME_PATHS,
  ZOHO_PEOPLE_COOP_VALUE,
  ZOHO_PEOPLE_FRAME_ANCESTORS,
  isZohoPeopleCoopPath,
  isZohoPeopleIframePath,
  applyZohoPeopleEmbedHeaders,
  applyZohoPeopleCoopHeaders,
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

  it('recognises iframe and COOP route sets', () => {
    expect(isZohoPeopleIframePath('/zoho/people')).toBe(true);
    expect(isZohoPeopleIframePath('/zoho/people/sandbox')).toBe(true);
    expect(isZohoPeopleIframePath('/zoho/people/embed-auth')).toBe(false);
    expect(isZohoPeopleCoopPath('/zoho/people/embed-auth')).toBe(true);
    expect(isZohoPeopleCoopPath('/zoho/people/oauth-bridge')).toBe(true);
    expect(isZohoPeopleCoopPath('/zoho/people/oauth-done')).toBe(true);
    expect(isZohoPeopleCoopPath('/app/integrations')).toBe(false);
    expect(ZOHO_PEOPLE_IFRAME_PATHS).toEqual(['/zoho/people', '/zoho/people/sandbox']);
    expect(ZOHO_PEOPLE_COOP_PATHS).toHaveLength(5);
  });

  it.each(ZOHO_PEOPLE_COOP_PATHS)(
    '%s returns COOP unsafe-none',
    async (path) => {
      const res = await request(app).get(path);
      expect(res.status).toBe(200);
      expect(res.headers['cross-origin-opener-policy']).toBe(ZOHO_PEOPLE_COOP_VALUE);
    },
  );

  it.each(ZOHO_PEOPLE_IFRAME_PATHS)(
    '%s returns Zoho frame-ancestors and no X-Frame-Options',
    async (path) => {
      const res = await request(app).get(path);
      expect(res.status).toBe(200);
      expect(res.headers['x-frame-options']).toBeUndefined();
      expect(res.headers['cross-origin-opener-policy']).toBe(ZOHO_PEOPLE_COOP_VALUE);

      const csp = String(res.headers['content-security-policy'] || '');
      expect(csp).toMatch(/frame-ancestors/i);
      for (const origin of ZOHO_PEOPLE_FRAME_ANCESTORS) {
        expect(csp).toContain(origin);
      }

      const body = String(res.text || '');
      for (const secret of FORBIDDEN_IN_HTML) {
        expect(body).not.toContain(secret);
      }
    },
  );

  it('keeps COOP protection on normal ShelfMerch routes', async () => {
    const res = await request(app).get('/api/v1/health/live');
    expect(res.status).toBe(200);
    const coop = String(res.headers['cross-origin-opener-policy'] || '').toLowerCase();
    expect(coop).toBe('same-origin');

    const xfo = res.headers['x-frame-options'];
    expect(xfo).toBeTruthy();
    expect(String(xfo).toLowerCase()).toMatch(/sameorigin|deny/);

    const csp = String(res.headers['content-security-policy'] || '');
    expect(csp).not.toContain('https://people.zoho.in');
    expect(csp).not.toContain('https://sigma.zoho.in');
  });

  it('applyZohoPeopleCoopHeaders sets unsafe-none', () => {
    const headers = new Map();
    const res = {
      setHeader(name, value) {
        headers.set(String(name).toLowerCase(), value);
      },
    };
    applyZohoPeopleCoopHeaders(res);
    expect(headers.get('cross-origin-opener-policy')).toBe('unsafe-none');
  });

  it('applyZohoPeopleEmbedHeaders sets COOP and frame allowlist', () => {
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
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    applyZohoPeopleEmbedHeaders(res);
    expect(headers.get('cross-origin-opener-policy')).toBe('unsafe-none');
    expect(headers.get('x-frame-options')).toBeUndefined();
    const csp = headers.get('content-security-policy');
    expect(csp).toContain('https://people.zoho.in');
    expect(csp).not.toMatch(/frame-ancestors[^;]*'none'/);
  });
});
