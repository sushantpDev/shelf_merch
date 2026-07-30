import { parse as parseCookie, serialize as serializeCookie } from 'cookie';
import { env } from '../../../config/env.js';

export const ZOHO_OAUTH_STATE_COOKIE = 'zoho_oauth_state';
export const ZOHO_AUTH_BRIDGE_COOKIE = 'zoho_auth_bridge';

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
