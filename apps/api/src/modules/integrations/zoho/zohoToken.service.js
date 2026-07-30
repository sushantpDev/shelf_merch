import { env, zohoAccountsUrl, zohoPeopleConfigured } from '../../../config/env.js';
import { ApiError } from '../../../utils/errors.js';
import { decryptToken, encryptToken } from '../../../utils/tokenEncryption.js';
import { ZohoIntegration } from './zohoIntegration.model.js';

const EXPIRY_SKEW_MS = 60_000;

function assertConfigured() {
  if (!zohoPeopleConfigured()) {
    throw new ApiError(503, 'Zoho People integration is not configured', 'ZOHO_NOT_CONFIGURED');
  }
}

/**
 * Refresh Zoho access token. Never returns tokens to the caller beyond this service layer
 * (callers use getValidAccessToken which keeps plaintext in-process only).
 */
async function refreshAccessToken(integration) {
  assertConfigured();
  const refreshToken = decryptToken(integration.encryptedRefreshToken);
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: env.ZOHO_CLIENT_ID,
    client_secret: env.ZOHO_CLIENT_SECRET,
    grant_type: 'refresh_token',
  });

  const res = await fetch(`${zohoAccountsUrl()}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    integration.status = 'expired';
    integration.lastError = 'Token refresh failed';
    await integration.save();
    throw new ApiError(401, 'Zoho connection expired — reconnect Zoho People', 'ZOHO_CONNECTION_EXPIRED');
  }

  const data = await res.json();
  if (!data.access_token) {
    integration.status = 'expired';
    integration.lastError = 'Token refresh returned no access token';
    await integration.save();
    throw new ApiError(401, 'Zoho connection expired — reconnect Zoho People', 'ZOHO_CONNECTION_EXPIRED');
  }

  const expiresInSec = Number(data.expires_in) || 3600;
  integration.encryptedAccessToken = encryptToken(data.access_token);
  integration.accessTokenExpiresAt = new Date(Date.now() + expiresInSec * 1000);
  if (data.api_domain) {
    integration.apiDomain = String(data.api_domain).replace(/\/$/, '');
  }
  if (integration.status === 'expired' || integration.status === 'error') {
    integration.status = 'connected';
    integration.lastError = '';
  }
  await integration.save();
  return data.access_token;
}

/**
 * Load the tenant's Zoho integration and return a valid (possibly refreshed) access token.
 * Plaintext token stays in memory for the request only — never sent to the frontend.
 */
export async function getValidAccessToken(tenantId) {
  const integration = await ZohoIntegration.findOne({ tenantId });
  if (!integration || integration.status === 'disconnected') {
    throw new ApiError(404, 'Zoho People is not connected', 'ZOHO_NOT_CONNECTED');
  }
  if (!integration.encryptedAccessToken || !integration.encryptedRefreshToken) {
    throw new ApiError(401, 'Zoho connection expired — reconnect Zoho People', 'ZOHO_CONNECTION_EXPIRED');
  }

  const expiresAt = integration.accessTokenExpiresAt
    ? new Date(integration.accessTokenExpiresAt).getTime()
    : 0;
  const expired = !expiresAt || expiresAt <= Date.now() + EXPIRY_SKEW_MS;

  let accessToken;
  if (expired) {
    accessToken = await refreshAccessToken(integration);
  } else {
    try {
      accessToken = decryptToken(integration.encryptedAccessToken);
    } catch {
      accessToken = await refreshAccessToken(integration);
    }
  }

  return { accessToken, integration };
}

/**
 * Securely invalidate stored Zoho tokens and mark disconnected.
 * Does not delete ShelfMerch orders or previously synced contacts.
 */
export async function disconnectZoho(tenantId) {
  const integration = await ZohoIntegration.findOne({ tenantId });
  if (!integration || integration.status === 'disconnected') {
    return null;
  }

  integration.encryptedAccessToken = '';
  integration.encryptedRefreshToken = '';
  integration.accessTokenExpiresAt = null;
  integration.status = 'disconnected';
  integration.lastError = '';
  await integration.save();
  return integration;
}
