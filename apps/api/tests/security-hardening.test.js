import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';
import {
  accessVerifyOptions,
  redemptionVerifyOptions,
  JWT_ACCESS_AUDIENCE,
  JWT_ISSUER,
} from '../src/config/jwt.js';
import { signAccessToken } from '../src/modules/auth/auth.service.js';
import { sanitizeMongoInput } from '../src/middleware/sanitize.middleware.js';
import { isFileAllowed, IMAGE_TYPES, SPREADSHEET_TYPES, DOCUMENT_TYPES } from '../src/middleware/upload.middleware.js';
import { consumeMemory } from '../src/services/rateLimit.service.js';

const fakeUser = { _id: '507f1f77bcf86cd799439011' };
const platformAssignment = {
  tenantId: null,
  role: 'platform_super_admin',
  scopeType: 'platform',
  scopeId: null,
  assignedEntityIds: [],
};

describe('JWT claim pinning (B3)', () => {
  it('signs access tokens with the pinned issuer and audience', () => {
    const token = signAccessToken(fakeUser, platformAssignment);
    const decoded = jwt.decode(token);
    expect(decoded.iss).toBe(JWT_ISSUER);
    expect(decoded.aud).toBe(JWT_ACCESS_AUDIENCE);
    expect(decoded.jti).toBeTruthy();
  });

  it('verifies with the access audience', () => {
    const token = signAccessToken(fakeUser, platformAssignment);
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, accessVerifyOptions());
    expect(payload.sub).toBe(String(fakeUser._id));
  });

  it('rejects an access token when verified against the redemption audience', () => {
    const token = signAccessToken(fakeUser, platformAssignment);
    expect(() => jwt.verify(token, env.JWT_ACCESS_SECRET, redemptionVerifyOptions())).toThrow();
  });

  it('rejects a token signed with a non-HS256 algorithm (alg confusion)', () => {
    const forged = jwt.sign({ sub: 'x' }, env.JWT_ACCESS_SECRET, {
      algorithm: 'HS512',
      issuer: JWT_ISSUER,
      audience: JWT_ACCESS_AUDIENCE,
    });
    expect(() => jwt.verify(forged, env.JWT_ACCESS_SECRET, accessVerifyOptions())).toThrow();
  });
});

describe('NoSQL input sanitizer (C1)', () => {
  function run(req) {
    let called = false;
    sanitizeMongoInput(req, {}, () => {
      called = true;
    });
    return called;
  }

  it('strips $-prefixed operator keys from the body, including nested', () => {
    const req = {
      body: { email: 'a@b.io', password: { $ne: null }, nested: { $gt: '' }, ok: 'keep' },
      params: {},
      query: {},
    };
    expect(run(req)).toBe(true);
    expect(req.body.password).toEqual({});
    expect(req.body.nested).toEqual({});
    expect(req.body.email).toBe('a@b.io');
    expect(req.body.ok).toBe('keep');
  });

  it('leaves clean input untouched', () => {
    const req = { body: { a: 1, b: { c: 2 } }, params: { id: 'x' }, query: {} };
    expect(run(req)).toBe(true);
    expect(req.body).toEqual({ a: 1, b: { c: 2 } });
  });

  it('handles arrays with embedded operators', () => {
    const req = { body: { arr: [{ $where: 'bad' }, { good: 1 }] }, params: {}, query: {} };
    run(req);
    expect(req.body.arr[0]).toEqual({});
    expect(req.body.arr[1]).toEqual({ good: 1 });
  });
});

describe('Upload allowlist (A4)', () => {
  it('accepts a genuine png as an image', () => {
    expect(isFileAllowed(IMAGE_TYPES, { originalname: 'logo.png', mimetype: 'image/png' })).toBe(true);
  });

  it('rejects an SVG masquerading as an image (stored-XSS vector)', () => {
    expect(isFileAllowed(IMAGE_TYPES, { originalname: 'x.svg', mimetype: 'image/svg+xml' })).toBe(false);
    expect(isFileAllowed(DOCUMENT_TYPES, { originalname: 'x.svg', mimetype: 'image/svg+xml' })).toBe(false);
  });

  it('rejects html and script extensions regardless of MIME', () => {
    expect(isFileAllowed(IMAGE_TYPES, { originalname: 'evil.html', mimetype: 'image/png' })).toBe(false);
    expect(isFileAllowed(IMAGE_TYPES, { originalname: 'evil.js', mimetype: 'image/png' })).toBe(false);
  });

  it('accepts a CSV with an unreliable MIME by extension', () => {
    expect(isFileAllowed(SPREADSHEET_TYPES, { originalname: 'contacts.csv', mimetype: 'application/octet-stream' })).toBe(true);
    expect(isFileAllowed(SPREADSHEET_TYPES, { originalname: 'contacts.csv', mimetype: 'text/csv' })).toBe(true);
  });

  it('rejects a pdf where only images are allowed', () => {
    expect(isFileAllowed(IMAGE_TYPES, { originalname: 'doc.pdf', mimetype: 'application/pdf' })).toBe(false);
    expect(isFileAllowed(DOCUMENT_TYPES, { originalname: 'doc.pdf', mimetype: 'application/pdf' })).toBe(true);
  });
});

describe('In-memory rate-limit fallback (A3)', () => {
  it('blocks once the limit is exceeded within the window', () => {
    const key = `test:fallback:${Date.now()}:${Math.random()}`;
    const opts = { key, limit: 3, windowSec: 60 };
    expect(consumeMemory(opts).allowed).toBe(true);
    expect(consumeMemory(opts).allowed).toBe(true);
    expect(consumeMemory(opts).allowed).toBe(true);
    const blocked = consumeMemory(opts);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });
});
