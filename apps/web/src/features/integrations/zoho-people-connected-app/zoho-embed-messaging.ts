/**
 * Cross-window messaging for the Zoho People Connected App embed.
 */

export const SHELFMERCH_ZOHO_EMBED_AUTH = 'SHELFMERCH_ZOHO_EMBED_AUTH';
export const SHELFMERCH_ZOHO_EMBED_OAUTH = 'SHELFMERCH_ZOHO_EMBED_OAUTH';

/** Target origin for postMessage — production shelfmerch.io, else current origin. */
export function shelfmerchPostMessageOrigin(): string {
  if (typeof window === 'undefined') return 'https://shelfmerch.io';
  if (window.location.hostname === 'shelfmerch.io') return 'https://shelfmerch.io';
  return window.location.origin;
}

export type ZohoEmbedAuthMessage = {
  type: typeof SHELFMERCH_ZOHO_EMBED_AUTH;
  code: string;
  requestId: string;
};

export type ZohoEmbedOAuthMessage = {
  type: typeof SHELFMERCH_ZOHO_EMBED_OAUTH;
  status: 'connected' | 'error';
  reason?: string;
};

export function isZohoEmbedAuthMessage(value: unknown): value is ZohoEmbedAuthMessage {
  if (!value || typeof value !== 'object') return false;
  const msg = value as ZohoEmbedAuthMessage;
  return (
    msg.type === SHELFMERCH_ZOHO_EMBED_AUTH &&
    typeof msg.code === 'string' &&
    typeof msg.requestId === 'string'
  );
}

export function isZohoEmbedOAuthMessage(value: unknown): value is ZohoEmbedOAuthMessage {
  if (!value || typeof value !== 'object') return false;
  const msg = value as ZohoEmbedOAuthMessage;
  return (
    msg.type === SHELFMERCH_ZOHO_EMBED_OAUTH &&
    (msg.status === 'connected' || msg.status === 'error')
  );
}

export function createEmbedRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
