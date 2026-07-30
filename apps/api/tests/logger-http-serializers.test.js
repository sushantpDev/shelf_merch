import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import pino from 'pino';
import { pinoHttp } from 'pino-http';
import express from 'express';
import request from 'supertest';
import {
  serializeHttpRequest,
  serializeHttpResponse,
  httpSerializers,
  safeRequestPath,
  createPinoHttpOptions,
  LOGGER_CONFIG_FILE,
} from '../src/config/logger.js';

const FORBIDDEN = [
  'oauth-code-test-secret',
  'oauth-state-test-secret',
  'refresh-token-test-secret',
  'client-secret-test-secret',
];

function assertNoSecrets(text) {
  for (const secret of FORBIDDEN) {
    expect(text).not.toContain(secret);
  }
  expect(text).not.toMatch(/client_id=/i);
  expect(text).not.toMatch(/[?&]code=/i);
  expect(text).not.toMatch(/[?&]state=/i);
}

describe('HTTP logger serializers (production logger.js)', () => {
  it('exports the active logger config file path', () => {
    expect(LOGGER_CONFIG_FILE.replace(/\\/g, '/')).toMatch(/config\/logger\.js$/);
  });

  it('safeRequestPath strips query string', () => {
    expect(
      safeRequestPath({
        originalUrl:
          '/api/integrations/zoho/callback?code=oauth-code-test-secret&state=oauth-state-test-secret',
      }),
    ).toBe('/api/integrations/zoho/callback');
  });

  it('request serializer keeps only id/method/path/remoteAddress for callback', () => {
    const serialized = serializeHttpRequest({
      id: 'req-1',
      method: 'GET',
      url: '/api/integrations/zoho/callback?code=oauth-code-test-secret&state=oauth-state-test-secret',
      originalUrl:
        '/api/integrations/zoho/callback?code=oauth-code-test-secret&state=oauth-state-test-secret',
      query: {
        code: 'oauth-code-test-secret',
        state: 'oauth-state-test-secret',
      },
      params: { code: 'oauth-code-test-secret' },
      body: {
        code: 'oauth-code-test-secret',
        state: 'oauth-state-test-secret',
        refresh_token: 'refresh-token-test-secret',
        client_secret: 'client-secret-test-secret',
      },
      headers: {
        authorization: 'Bearer oauth-code-test-secret',
        cookie: 'session=oauth-state-test-secret',
      },
      socket: { remoteAddress: '127.0.0.1' },
    });

    expect(serialized).toEqual({
      id: 'req-1',
      method: 'GET',
      path: '/api/integrations/zoho/callback',
      remoteAddress: '127.0.0.1',
    });
    assertNoSecrets(JSON.stringify(serialized));
  });

  it('request serializer for connect omits Location-bound secrets from req', () => {
    const serialized = serializeHttpRequest({
      id: 'req-2',
      method: 'GET',
      url: '/api/integrations/zoho/connect',
      originalUrl: '/api/integrations/zoho/connect',
      headers: { authorization: 'Bearer x', cookie: 'a=b' },
      socket: { remoteAddress: '10.0.0.1' },
    });
    expect(serialized).toEqual({
      id: 'req-2',
      method: 'GET',
      path: '/api/integrations/zoho/connect',
      remoteAddress: '10.0.0.1',
    });
    assertNoSecrets(JSON.stringify(serialized));
  });

  it('response serializer returns only statusCode (never location)', () => {
    const serialized = serializeHttpResponse({
      statusCode: 302,
      headers: {
        location:
          'https://accounts.zoho.in/oauth/v2/auth?client_id=abc&state=oauth-state-test-secret',
        'set-cookie': ['token=refresh-token-test-secret'],
      },
      getHeader(name) {
        return this.headers[String(name).toLowerCase()];
      },
    });
    expect(serialized).toEqual({ statusCode: 302 });
    assertNoSecrets(JSON.stringify(serialized));
  });

  it('pino + serializers never emit OAuth secrets when logging { req, res }', () => {
    const lines = [];
    const dest = {
      write(chunk) {
        lines.push(String(chunk));
      },
    };
    const testLogger = pino(
      {
        level: 'info',
        serializers: httpSerializers,
      },
      dest,
    );

    const req = {
      id: 'r1',
      method: 'GET',
      url: '/api/integrations/zoho/callback?code=oauth-code-test-secret&state=oauth-state-test-secret',
      originalUrl:
        '/api/integrations/zoho/callback?code=oauth-code-test-secret&state=oauth-state-test-secret',
      query: { code: 'oauth-code-test-secret', state: 'oauth-state-test-secret' },
      body: {
        refresh_token: 'refresh-token-test-secret',
        client_secret: 'client-secret-test-secret',
      },
      headers: { authorization: 'Bearer x', cookie: 'c=1' },
      socket: { remoteAddress: '127.0.0.1' },
    };
    const res = {
      statusCode: 302,
      headers: {
        location:
          'https://accounts.zoho.in/oauth/v2/auth?client_id=cid&state=oauth-state-test-secret',
      },
    };

    testLogger.info({ req, res }, 'request completed');
    const joined = lines.join('');
    assertNoSecrets(joined);
    expect(joined).toContain('/api/integrations/zoho/callback');
    expect(joined).toContain('"statusCode":302');
    expect(joined).not.toContain('originalUrl');
    expect(joined).not.toContain('"query"');
  });

  it('pino-http auto-logging omits secrets for connect and callback', async () => {
    const lines = [];
    const dest = {
      write(chunk) {
        lines.push(String(chunk));
      },
    };
    const httpLogger = pino({ level: 'info', serializers: httpSerializers }, dest);

    const app = express();
    app.use(
      pinoHttp({
        ...createPinoHttpOptions(),
        logger: httpLogger,
      }),
    );
    app.get('/api/integrations/zoho/connect', (_req, res) => {
      res.redirect(
        302,
        'https://accounts.zoho.in/oauth/v2/auth?client_id=cid&state=oauth-state-test-secret&code=oauth-code-test-secret',
      );
    });
    app.get('/api/integrations/zoho/callback', (_req, res) => {
      res.redirect(302, '/app/integrations?zoho=connected');
    });

    await request(app).get('/api/integrations/zoho/connect').expect(302);
    await request(app)
      .get(
        '/api/integrations/zoho/callback?code=oauth-code-test-secret&state=oauth-state-test-secret',
      )
      .expect(302);

    const joined = lines.join('');
    assertNoSecrets(joined);
    expect(joined).toContain('/api/integrations/zoho/connect');
    expect(joined).toContain('/api/integrations/zoho/callback');
    expect(joined).toContain('"statusCode":302');
    expect(joined).not.toContain('accounts.zoho.in');
    expect(joined).not.toContain('"location"');
  });
});
