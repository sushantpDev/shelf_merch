import { ApiError } from '../../../utils/errors.js';
import {
  env,
  zohoIntegrationsClientPath,
  zohoPeopleConfigured,
} from '../../../config/env.js';
import { ZohoIntegration, ZOHO_PUBLIC_STATUSES } from './zohoIntegration.model.js';
import { beginZohoConnect, completeZohoConnection } from './zohoOAuth.service.js';
import { consumeOAuthState } from './zohoOAuthState.service.js';
import { disconnectZoho } from './zohoToken.service.js';
import { syncZohoEmployees } from './zohoSync.service.js';
import {
  clearAuthBridgeCookie,
  clearOAuthStateCookie,
  readCookies,
  setAuthBridgeCookie,
  setOAuthStateCookie,
  ZOHO_AUTH_BRIDGE_COOKIE,
  ZOHO_OAUTH_STATE_COOKIE,
} from './zohoCookies.js';

function clientRedirect(query) {
  const base = (env.BASE_URL || env.APP_URL || '').replace(/\/$/, '');
  const path = zohoIntegrationsClientPath();
  const qs = new URLSearchParams(query).toString();
  // Prefer absolute URL when BASE_URL/APP_URL is set; otherwise relative (same origin).
  const target = base ? `${base}${path}?${qs}` : `${path}?${qs}`;
  return target;
}

function publicStatus(doc) {
  if (!doc || doc.status === 'disconnected') return ZOHO_PUBLIC_STATUSES.not_connected;
  if (doc.status === 'connected') return ZOHO_PUBLIC_STATUSES.connected;
  if (doc.status === 'needs_attention') return ZOHO_PUBLIC_STATUSES.needs_attention;
  if (doc.status === 'expired') return ZOHO_PUBLIC_STATUSES.expired;
  return ZOHO_PUBLIC_STATUSES.error;
}

export async function getStatus(req, res) {
  const doc = await ZohoIntegration.findOne({ tenantId: req.tenantId });
  const status = publicStatus(doc);
  if (!doc || status === ZOHO_PUBLIC_STATUSES.not_connected) {
    return res.json({
      configured: zohoPeopleConfigured(),
      status: ZOHO_PUBLIC_STATUSES.not_connected,
      integration: null,
    });
  }
  return res.json({
    configured: zohoPeopleConfigured(),
    status,
    integration: doc.toPublicJSON(),
  });
}

/**
 * Sets an HttpOnly cookie so the subsequent browser navigation to GET /connect
 * can authenticate without putting the JWT in the query string.
 */
export async function bridge(req, res) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    throw new ApiError(401, 'Missing access token', 'UNAUTHORIZED');
  }
  setAuthBridgeCookie(res, token);
  return res.json({ ok: true });
}

export async function connect(req, res) {
  const { url, state } = await beginZohoConnect({
    tenantId: req.tenantId,
    userId: req.user.userId,
  });
  setOAuthStateCookie(res, state);
  clearAuthBridgeCookie(res);
  return res.redirect(302, url);
}

export async function callback(req, res) {
  const { code, state, error, location: zohoLocation } = req.query;

  clearOAuthStateCookie(res);

  if (error) {
    return res.redirect(302, clientRedirect({ zoho: 'error', reason: 'denied' }));
  }

  const cookies = readCookies(req);
  const cookieState = cookies[ZOHO_OAUTH_STATE_COOKIE];
  if (!state || !cookieState || cookieState !== state) {
    return res.redirect(302, clientRedirect({ zoho: 'error', reason: 'state' }));
  }

  let oauthRecord;
  try {
    oauthRecord = await consumeOAuthState(state);
  } catch {
    return res.redirect(302, clientRedirect({ zoho: 'error', reason: 'state' }));
  }

  if (!code || typeof code !== 'string') {
    return res.redirect(302, clientRedirect({ zoho: 'error', reason: 'code' }));
  }

  try {
    await completeZohoConnection({
      tenantId: oauthRecord.tenantId,
      userId: oauthRecord.userId,
      code,
      zohoLocation: typeof zohoLocation === 'string' ? zohoLocation : '',
    });
    return res.redirect(302, clientRedirect({ zoho: 'connected' }));
  } catch {
    return res.redirect(302, clientRedirect({ zoho: 'error' }));
  }
}

export async function syncEmployees(req, res) {
  const summary = await syncZohoEmployees(req.tenantId);
  return res.json(summary);
}

export async function disconnect(req, res) {
  await disconnectZoho(req.tenantId);
  return res.json({ ok: true, status: ZOHO_PUBLIC_STATUSES.not_connected });
}

/** Authenticate using Bearer header or the short-lived Zoho bridge cookie. */
export function extractZohoAccessToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  const cookies = readCookies(req);
  return cookies[ZOHO_AUTH_BRIDGE_COOKIE] || null;
}
