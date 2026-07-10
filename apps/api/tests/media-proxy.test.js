import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

let app;
beforeAll(() => {
  app = createApp();
});

describe('media proxy hardening (SSRF / path traversal)', () => {
  it('requires a url param', async () => {
    const res = await request(app).get('/api/v1/media/proxy');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('URL_REQUIRED');
  });

  it('rejects local path traversal outside the uploads dir', async () => {
    for (const evil of [
      '/uploads/../../../../etc/passwd',
      '/uploads/..%2f..%2fetc/passwd', // pre-decoded by the client, but defensive
      '/uploads//etc/passwd',
    ]) {
      const res = await request(app).get('/api/v1/media/proxy').query({ url: evil });
      expect([400, 403]).toContain(res.status);
      expect(res.status).not.toBe(200);
    }
  });

  it('rejects remote URLs that are not on the storage allowlist (SSRF guard)', async () => {
    for (const evil of [
      'http://169.254.169.254/latest/meta-data/',
      'http://localhost:6379/',
      'https://s3.ap-south-1.amazonaws.com.attacker.example/bucket/x.png',
      'file:///etc/passwd',
    ]) {
      const res = await request(app).get('/api/v1/media/proxy').query({ url: evil });
      expect([400, 403]).toContain(res.status);
      expect(res.status).not.toBe(200);
    }
  });
});
