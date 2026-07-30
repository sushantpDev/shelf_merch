import { parse as parseCookie, serialize as serializeCookie } from 'cookie';
import { env } from '../../../config/env.js';

export const ZOHO_OAUTH_STATE_COOKIE = 'zoho_oauth_state';
export const ZOHO_AUTH_BRIDGE_COOKIE = 'zoho_auth_bridge';
/** Partitioned third-party iframe session — __Host- prefix (Secure, Path=/, no Domain). */
export const ZOHO_EMBED_SESSION_COOKIE = '__Host-shelfmerch-zoho-embed';
/** Short-lived marker so OAuth callback can redirect to the embed popup page. */
export const ZOHO_OAUTH_POPUP_COOKIE = 'zoho_oauth_popup';

export function readCookies(req) {
  const header = req.headers?.cookie;
  if (!header) return {};
  try {
    return parseCookie(header);
  } catch {
    return {};
  }
}

function cookieBaseOptions() {
  const secure = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/api/integrations/zoho',
  };
}

export function setOAuthStateCookie(res, state) {
  res.append(
    'Set-Cookie',
    serializeCookie(ZOHO_OAUTH_STATE_COOKIE, state, {
      ...cookieBaseOptions(),
      maxAge: 10 * 60,
    }),
  );
}

export function clearOAuthStateCookie(res) {
  res.append(
    'Set-Cookie',
    serializeCookie(ZOHO_OAUTH_STATE_COOKIE, '', {
      ...cookieBaseOptions(),
      maxAge: 0,
    }),
  );
}

/** Short-lived bridge so a browser navigation to /connect is authenticated. */
export function setAuthBridgeCookie(res, accessToken) {
  res.append(
    'Set-Cookie',
    serializeCookie(ZOHO_AUTH_BRIDGE_COOKIE, accessToken, {
      ...cookieBaseOptions(),
      maxAge: 5 * 60,
    }),
  );
}

export function clearAuthBridgeCookie(res) {
  res.append(
    'Set-Cookie',
    serializeCookie(ZOHO_AUTH_BRIDGE_COOKIE, '', {
      ...cookieBaseOptions(),
      maxAge: 0,
    }),
  );
}

/**
 * Embedded Zoho iframe session — HttpOnly, Secure, SameSite=None, Partitioned.
 * __Host- prefix requires Path=/ and no Domain attribute.
 */
export function setEmbedSessionCookie(res, sessionToken, maxAgeSec = 8 * 60 * 60) {
  const parts = [
    `${ZOHO_EMBED_SESSION_COOKIE}=${encodeURIComponent(sessionToken)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=None',
    'Partitioned',
    `Max-Age=${maxAgeSec}`,
  ];
  res.append('Set-Cookie', parts.join('; '));
}

export function clearEmbedSessionCookie(res) {
  const parts = [
    `${ZOHO_EMBED_SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=None',
    'Partitioned',
    'Max-Age=0',
  ];
  res.append('Set-Cookie', parts.join('; '));
}

export function setOAuthPopupCookie(res) {
  res.append(
    'Set-Cookie',
    serializeCookie(ZOHO_OAUTH_POPUP_COOKIE, '1', {
      ...cookieBaseOptions(),
      maxAge: 10 * 60,
    }),
  );
}

export function clearOAuthPopupCookie(res) {
  res.append(
    'Set-Cookie',
    serializeCookie(ZOHO_OAUTH_POPUP_COOKIE, '', {
      ...cookieBaseOptions(),
      maxAge: 0,
    }),
  );
}

export function isOAuthPopupRequest(req) {
  return readCookies(req)[ZOHO_OAUTH_POPUP_COOKIE] === '1';
}
