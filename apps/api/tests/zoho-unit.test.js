import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { encryptToken, decryptToken, resolveEncryptionKey } from '../src/utils/tokenEncryption.js';
import {
  generateOAuthState,
  storeOAuthState,
  consumeOAuthState,
  clearMemoryOAuthStates,
} from '../src/modules/integrations/zoho/zohoOAuthState.service.js';
import { ApiError } from '../src/utils/errors.js';
import {
  resolveZohoPeopleBaseUrl,
  inferZohoLocationFromApiDomain,
  normalizeZohoLocation,
  PEOPLE_BASE_BY_LOCATION,
} from '../src/modules/integrations/zoho/zohoPeopleBaseUrl.js';
import { validateZohoRedirectUri } from '../src/config/env.js';
import * as envModule from '../src/config/env.js';
import { beginZohoConnect, exchangeAuthorizationCode } from '../src/modules/integrations/zoho/zohoOAuth.service.js';

describe('token encryption (AES-256-GCM)', () => {
  it('round-trips plaintext', () => {
    const secret = 'zoho-access-token-example-value';
    const sealed = encryptToken(secret);
    expect(sealed).not.toContain(secret);
    expect(decryptToken(sealed)).toBe(secret);
  });

  it('produces different ciphertext for the same plaintext (random IV)', () => {
    const a = encryptToken('same');
    const b = encryptToken('same');
    expect(a).not.toBe(b);
    expect(decryptToken(a)).toBe('same');
    expect(decryptToken(b)).toBe('same');
  });

  it('rejects tampered ciphertext', () => {
    const sealed = encryptToken('sensitive');
    const buf = Buffer.from(sealed, 'base64url');
    buf[buf.length - 5] ^= 0xff;
    const tampered = buf.toString('base64url');
    expect(() => decryptToken(tampered)).toThrow(ApiError);
  });

  it('rejects empty plaintext', () => {
    expect(() => encryptToken('')).toThrow(ApiError);
  });

  it('resolves a 32-byte hex key', () => {
    const key = resolveEncryptionKey(
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    );
    expect(key).toHaveLength(32);
  });
});

describe('OAuth state validation', () => {
  beforeAll(() => {
    clearMemoryOAuthStates();
  });
  afterAll(() => {
    clearMemoryOAuthStates();
  });

  it('generates a high-entropy state string', () => {
    const a = generateOAuthState();
    const b = generateOAuthState();
    expect(a).toHaveLength(64);
    expect(a).not.toBe(b);
    expect(/^[0-9a-f]+$/.test(a)).toBe(true);
  });

  it('stores and consumes state bound to tenant + user', async () => {
    const state = generateOAuthState();
    await storeOAuthState(state, { tenantId: 'tenant-1', userId: 'user-1' });
    const record = await consumeOAuthState(state);
    expect(record.tenantId).toBe('tenant-1');
    expect(record.userId).toBe('user-1');
  });

  it('rejects missing / short state', async () => {
    await expect(consumeOAuthState('')).rejects.toThrow(ApiError);
    await expect(consumeOAuthState('short')).rejects.toThrow(ApiError);
  });

  it('rejects unknown state and prevents replay', async () => {
    const state = generateOAuthState();
    await storeOAuthState(state, { tenantId: 't', userId: 'u' });
    await consumeOAuthState(state);
    await expect(consumeOAuthState(state)).rejects.toThrow(ApiError);
    await expect(consumeOAuthState(generateOAuthState())).rejects.toThrow(ApiError);
  });
});

describe('Zoho People base URL mapper (data-centre aware)', () => {
  it('maps OAuth locations to People product hosts', () => {
    expect(resolveZohoPeopleBaseUrl({ location: 'in' })).toBe('https://people.zoho.in');
    expect(resolveZohoPeopleBaseUrl({ location: 'us' })).toBe('https://people.zoho.com');
    expect(resolveZohoPeopleBaseUrl({ location: 'com' })).toBe('https://people.zoho.com');
    expect(resolveZohoPeopleBaseUrl({ location: 'eu' })).toBe('https://people.zoho.eu');
    expect(resolveZohoPeopleBaseUrl({ location: 'au' })).toBe('https://people.zoho.com.au');
    expect(resolveZohoPeopleBaseUrl({ location: 'jp' })).toBe('https://people.zoho.jp');
    expect(resolveZohoPeopleBaseUrl({ location: 'ca' })).toBe('https://people.zohocloud.ca');
    expect(resolveZohoPeopleBaseUrl({ location: 'sa' })).toBe('https://people.zoho.sa');
  });

  it('does not use zohoapis api_domain as the People host', () => {
    const base = resolveZohoPeopleBaseUrl({
      location: 'in',
      apiDomain: 'https://www.zohoapis.in',
    });
    expect(base).toBe('https://people.zoho.in');
    expect(base).not.toContain('zohoapis');
  });

  it('infers location from api_domain when location is missing', () => {
    expect(inferZohoLocationFromApiDomain('https://www.zohoapis.in')).toBe('in');
    expect(inferZohoLocationFromApiDomain('https://www.zohoapis.eu')).toBe('eu');
    expect(resolveZohoPeopleBaseUrl({ apiDomain: 'https://www.zohoapis.in' })).toBe(
      'https://people.zoho.in',
    );
  });

  it('defaults to India People host when location and api_domain are empty', () => {
    expect(resolveZohoPeopleBaseUrl({})).toBe(PEOPLE_BASE_BY_LOCATION.in);
  });

  it('normalizes location aliases', () => {
    expect(normalizeZohoLocation('IN')).toBe('in');
    expect(normalizeZohoLocation(' us ')).toBe('us');
  });

  it('rejects unsupported locations when explicitly provided', () => {
    expect(() => resolveZohoPeopleBaseUrl({ location: 'xx' })).toThrow(ApiError);
  });
});

describe('ZOHO_REDIRECT_URI validation', () => {
  const localUri = 'http://localhost:8080/api/integrations/zoho/callback';
  const prodUri = 'https://shelfmerch.io/api/integrations/zoho/callback';

  it('accepts development and production redirect URIs', () => {
    expect(validateZohoRedirectUri(localUri)).toEqual({ ok: true, value: localUri });
    expect(validateZohoRedirectUri(prodUri)).toEqual({ ok: true, value: prodUri });
  });

  it('rejects trailing slash', () => {
    expect(validateZohoRedirectUri(`${localUri}/`).ok).toBe(false);
  });
});

describe('Zoho employee response parsing', () => {
  it('flattens nested getRecords response with one employee', async () => {
    const { extractEmployeeRecords, mapEmployeeRecord } = await import(
      '../src/modules/integrations/zoho/zohoPeople.service.js'
    );
    const payload = {
      response: {
        result: [
          {
            '759415000001155233': [
              {
                Zoho_ID: 759415000001155233,
                EmployeeID: 'HRM01',
                FirstName: 'Ada',
                LastName: 'Lovelace',
                EmailID: 'ada@example.com',
                Department: 'Engineering',
                Employeestatus: 'Active',
              },
            ],
          },
        ],
        message: 'Data fetched successfully',
        status: 0,
      },
    };
    const raw = extractEmployeeRecords(payload);
    expect(raw).toHaveLength(1);
    const mapped = mapEmployeeRecord(raw[0]);
    expect(mapped.ok).toBe(true);
    // Outer key wins over imprecise JSON number Zoho_ID
    expect(mapped.record.zohoRecordId).toBe('759415000001155233');
    expect(mapped.record.employeeId).toBe('HRM01');
    expect(mapped.record.email).toBe('ada@example.com');
    expect(mapped.record.firstName).toBe('Ada');
  });

  it('parses P_EmployeeView-style records and field aliases', async () => {
    const { extractEmployeeRecords, mapEmployeeRecord } = await import(
      '../src/modules/integrations/zoho/zohoPeople.service.js'
    );
    const payload = {
      response: {
        result: [
          {
            Zoho_ID: '99',
            EmployeeID: { ID: 'E-9', name: 'E-9' },
            DisplayName: 'Grace Hopper',
            Email: 'grace@example.com',
            EmployeeStatus: 'Active',
            DateOfJoining: '01-Jan-2020',
            LocationName: 'HQ',
          },
        ],
        status: 0,
      },
    };
    const raw = extractEmployeeRecords(payload);
    expect(raw).toHaveLength(1);
    const mapped = mapEmployeeRecord(raw[0]);
    expect(mapped.ok).toBe(true);
    expect(mapped.record.displayName).toBe('Grace Hopper');
    expect(mapped.record.employeeId).toBe('E-9');
    expect(mapped.record.email).toBe('grace@example.com');
    expect(mapped.record.dateOfJoining).toBe('01-Jan-2020');
    expect(mapped.record.location).toBe('HQ');
    expect(mapped.record.employmentStatus).toBe('Active');
  });

  it('maps EmployeeID.ID and Dateofjoining aliases', async () => {
    const { mapEmployeeRecord } = await import('../src/modules/integrations/zoho/zohoPeople.service.js');
    const mapped = mapEmployeeRecord({
      Zoho_ID: '42',
      EmployeeID: { ID: 'EMP-42' },
      FirstName: 'Alan',
      Dateofjoining: '15-Mar-2019',
      Employeestatus: 'Active',
      EmailID: 'alan@example.com',
    });
    expect(mapped.ok).toBe(true);
    expect(mapped.record.employeeId).toBe('EMP-42');
    expect(mapped.record.dateOfJoining).toBe('15-Mar-2019');
  });

  it('allows missing optional fields', async () => {
    const { mapEmployeeRecord } = await import('../src/modules/integrations/zoho/zohoPeople.service.js');
    const mapped = mapEmployeeRecord({
      Zoho_ID: '1',
      FirstName: 'Only',
      EmailID: 'only@example.com',
    });
    expect(mapped.ok).toBe(true);
    expect(mapped.record.department).toBe('');
    expect(mapped.record.designation).toBe('');
    expect(mapped.record.location).toBe('');
  });

  it('safe diagnostics omit credentials and employee values', async () => {
    const { logger } = await import('../src/config/logger.js');
    const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        response: {
          result: [
            {
              '1001': [
                {
                  Zoho_ID: '1001',
                  EmployeeID: 'E1',
                  FirstName: 'SecretName',
                  EmailID: 'secret@example.com',
                },
              ],
            },
          ],
          status: 0,
          message: 'Data fetched successfully',
        },
      }),
    });

    try {
      const { fetchAllZohoEmployees } = await import(
        '../src/modules/integrations/zoho/zohoPeople.service.js'
      );
      await fetchAllZohoEmployees({
        location: 'in',
        apiDomain: 'https://www.zohoapis.in',
        accessToken: 'super-secret-access-token',
      });
      expect(infoSpy).toHaveBeenCalled();
      const logged = JSON.stringify(infoSpy.mock.calls);
      expect(logged).not.toContain('super-secret-access-token');
      expect(logged).not.toContain('secret@example.com');
      expect(logged).not.toContain('SecretName');
      expect(logged).toContain('/people/api/forms/employee/getRecords');
    } finally {
      infoSpy.mockRestore();
      fetchMock.mockRestore();
    }
  });

  it('parses organisation response variants', async () => {
    const { parseOrganizationResponse } = await import(
      '../src/modules/integrations/zoho/zohoPeople.service.js'
    );
    expect(
      parseOrganizationResponse({
        organization: { organizationId: 'org-1', organizationName: 'Acme' },
      }),
    ).toEqual({ id: 'org-1', name: 'Acme' });
    expect(
      parseOrganizationResponse({
        data: { id: '42', name: 'Rubix' },
      }),
    ).toEqual({ id: '42', name: 'Rubix' });
    // Documented v3 sample uses Company as organisation id (no display name).
    expect(
      parseOrganizationResponse({
        Company: '89740123',
        ContactPerson: 'Anonymous',
        TimeZone: 'Asia/Kolkata',
      }),
    ).toEqual({ id: '89740123', name: '' });
  });

  it('authorization and token exchange share redirect_uri and encode once', async () => {
    const localUri = 'http://localhost:8080/api/integrations/zoho/callback';
    const previous = { ...envModule.env };
    Object.assign(envModule.env, {
      ZOHO_CLIENT_ID: 'test-zoho-client',
      ZOHO_CLIENT_SECRET: 'test-zoho-secret',
      ZOHO_REDIRECT_URI: localUri,
      ZOHO_ACCOUNTS_URL: 'https://accounts.zoho.in',
      TOKEN_ENCRYPTION_KEY:
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      NODE_ENV: 'test',
    });
    const configuredSpy = vi.spyOn(envModule, 'zohoPeopleConfigured').mockReturnValue(true);
    const redirectSpy = vi.spyOn(envModule, 'zohoRedirectUri').mockReturnValue(localUri);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'a',
        refresh_token: 'r',
        expires_in: 3600,
        api_domain: 'https://www.zohoapis.in',
      }),
    });

    try {
      const { url } = await beginZohoConnect({ tenantId: 't1', userId: 'u1' });
      const authRedirect = new URL(url).searchParams.get('redirect_uri');
      expect(authRedirect).toBe(localUri);
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost');
      expect(url).not.toContain('%253A');

      await exchangeAuthorizationCode('test-code');
      const body = new URLSearchParams(fetchMock.mock.calls[0][1].body);
      expect(body.get('redirect_uri')).toBe(localUri);
      expect(body.get('redirect_uri')).toBe(authRedirect);
    } finally {
      fetchMock.mockRestore();
      configuredSpy.mockRestore();
      redirectSpy.mockRestore();
      Object.assign(envModule.env, previous);
    }
  });
});

describe('ZOHO_REDIRECT_URI validation and OAuth usage', () => {
  const localUri = 'http://localhost:8080/api/integrations/zoho/callback';
  const prodUri = 'https://shelfmerch.io/api/integrations/zoho/callback';

  it('accepts development and production redirect URIs', () => {
    expect(validateZohoRedirectUri(localUri)).toEqual({ ok: true, value: localUri });
    expect(validateZohoRedirectUri(prodUri)).toEqual({ ok: true, value: prodUri });
  });

  it('rejects trailing-slash mismatch', () => {
    const result = validateZohoRedirectUri(`${localUri}/`);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/trailing slash/i);
  });

  it('rejects relative or wrong-path URIs', () => {
    expect(validateZohoRedirectUri('/api/integrations/zoho/callback').ok).toBe(false);
    expect(validateZohoRedirectUri('http://localhost:8080/api/v1/integrations/zoho/callback').ok).toBe(
      false,
    );
  });

  it('encodes redirect_uri exactly once in the authorization URL', async () => {
    const previous = { ...envModule.env };
    Object.assign(envModule.env, {
      ZOHO_CLIENT_ID: 'test-zoho-client',
      ZOHO_CLIENT_SECRET: 'test-zoho-secret',
      ZOHO_REDIRECT_URI: localUri,
      ZOHO_ACCOUNTS_URL: 'https://accounts.zoho.in',
      TOKEN_ENCRYPTION_KEY:
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      NODE_ENV: 'test',
    });
    const configuredSpy = vi.spyOn(envModule, 'zohoPeopleConfigured').mockReturnValue(true);
    const redirectSpy = vi.spyOn(envModule, 'zohoRedirectUri').mockReturnValue(localUri);

    try {
      const { url } = await beginZohoConnect({ tenantId: 't1', userId: 'u1' });
      const parsed = new URL(url);
      expect(parsed.searchParams.get('redirect_uri')).toBe(localUri);
      // Single encoding: raw query should contain %3A%2F%2F once for ://, not double-encoded %253A
      expect(parsed.search).toContain('redirect_uri=http%3A%2F%2Flocalhost');
      expect(parsed.search).not.toContain('%253A');
    } finally {
      configuredSpy.mockRestore();
      redirectSpy.mockRestore();
      Object.assign(envModule.env, previous);
    }
  });

  it('token exchange sends the same redirect_uri as authorization', async () => {
    const previous = { ...envModule.env };
    Object.assign(envModule.env, {
      ZOHO_CLIENT_ID: 'test-zoho-client',
      ZOHO_CLIENT_SECRET: 'test-zoho-secret',
      ZOHO_REDIRECT_URI: prodUri,
      ZOHO_ACCOUNTS_URL: 'https://accounts.zoho.in',
      TOKEN_ENCRYPTION_KEY:
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      NODE_ENV: 'test',
    });
    const configuredSpy = vi.spyOn(envModule, 'zohoPeopleConfigured').mockReturnValue(true);
    const redirectSpy = vi.spyOn(envModule, 'zohoRedirectUri').mockReturnValue(prodUri);

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'a',
        refresh_token: 'r',
        expires_in: 3600,
        api_domain: 'https://www.zohoapis.in',
      }),
    });

    try {
      const { url } = await beginZohoConnect({ tenantId: 't1', userId: 'u1' });
      const authRedirect = new URL(url).searchParams.get('redirect_uri');

      await exchangeAuthorizationCode('test-code');
      expect(fetchMock).toHaveBeenCalled();
      const [, init] = fetchMock.mock.calls[0];
      const body = new URLSearchParams(init.body);
      expect(body.get('redirect_uri')).toBe(prodUri);
      expect(body.get('redirect_uri')).toBe(authRedirect);
      expect(body.get('grant_type')).toBe('authorization_code');
      // Never assert or log secrets — only confirm the field exists without printing it
      expect(body.has('client_secret')).toBe(true);
    } finally {
      fetchMock.mockRestore();
      configuredSpy.mockRestore();
      redirectSpy.mockRestore();
      Object.assign(envModule.env, previous);
    }
  });
});

describe('ZOHO_REDIRECT_URI validation and OAuth usage', () => {
  const localUri = 'http://localhost:8080/api/integrations/zoho/callback';
  const prodUri = 'https://shelfmerch.io/api/integrations/zoho/callback';

  it('accepts development and production redirect URIs', () => {
    expect(validateZohoRedirectUri(localUri)).toEqual({ ok: true, value: localUri });
    expect(validateZohoRedirectUri(prodUri)).toEqual({ ok: true, value: prodUri });
  });

  it('rejects trailing-slash mismatch', () => {
    const result = validateZohoRedirectUri(`${localUri}/`);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/trailing slash/i);
  });

  it('rejects relative or wrong-path URIs', () => {
    expect(validateZohoRedirectUri('/api/integrations/zoho/callback').ok).toBe(false);
    expect(validateZohoRedirectUri('http://localhost:8080/api/v1/integrations/zoho/callback').ok).toBe(
      false,
    );
  });

  it('encodes redirect_uri exactly once in the authorization URL', async () => {
    const previous = { ...envModule.env };
    Object.assign(envModule.env, {
      ZOHO_CLIENT_ID: 'test-zoho-client',
      ZOHO_CLIENT_SECRET: 'test-zoho-secret',
      ZOHO_REDIRECT_URI: localUri,
      ZOHO_ACCOUNTS_URL: 'https://accounts.zoho.in',
      TOKEN_ENCRYPTION_KEY:
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      NODE_ENV: 'test',
    });
    const configuredSpy = vi.spyOn(envModule, 'zohoPeopleConfigured').mockReturnValue(true);
    const redirectSpy = vi.spyOn(envModule, 'zohoRedirectUri').mockReturnValue(localUri);

    try {
      const { url } = await beginZohoConnect({ tenantId: 't1', userId: 'u1' });
      const parsed = new URL(url);
      expect(parsed.searchParams.get('redirect_uri')).toBe(localUri);
      // Single encoding: raw query should contain %3A%2F%2F once for ://, not double-encoded %253A
      expect(parsed.search).toContain('redirect_uri=http%3A%2F%2Flocalhost');
      expect(parsed.search).not.toContain('%253A');
    } finally {
      configuredSpy.mockRestore();
      redirectSpy.mockRestore();
      Object.assign(envModule.env, previous);
    }
  });

  it('token exchange sends the same redirect_uri as authorization', async () => {
    const previous = { ...envModule.env };
    Object.assign(envModule.env, {
      ZOHO_CLIENT_ID: 'test-zoho-client',
      ZOHO_CLIENT_SECRET: 'test-zoho-secret',
      ZOHO_REDIRECT_URI: prodUri,
      ZOHO_ACCOUNTS_URL: 'https://accounts.zoho.in',
      TOKEN_ENCRYPTION_KEY:
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      NODE_ENV: 'test',
    });
    const configuredSpy = vi.spyOn(envModule, 'zohoPeopleConfigured').mockReturnValue(true);
    const redirectSpy = vi.spyOn(envModule, 'zohoRedirectUri').mockReturnValue(prodUri);

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'a',
        refresh_token: 'r',
        expires_in: 3600,
        api_domain: 'https://www.zohoapis.in',
      }),
    });

    try {
      const { url } = await beginZohoConnect({ tenantId: 't1', userId: 'u1' });
      const authRedirect = new URL(url).searchParams.get('redirect_uri');

      await exchangeAuthorizationCode('test-code');
      expect(fetchMock).toHaveBeenCalled();
      const [, init] = fetchMock.mock.calls[0];
      const body = new URLSearchParams(init.body);
      expect(body.get('redirect_uri')).toBe(prodUri);
      expect(body.get('redirect_uri')).toBe(authRedirect);
      expect(body.get('grant_type')).toBe('authorization_code');
      // Never assert or log secrets — only confirm the field exists without printing it
      expect(body.has('client_secret')).toBe(true);
    } finally {
      fetchMock.mockRestore();
      configuredSpy.mockRestore();
      redirectSpy.mockRestore();
      Object.assign(envModule.env, previous);
    }
  });
});
