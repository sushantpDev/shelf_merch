/**
 * Testable embed auth messenger (mirrors web zoho-embed-messaging.ts).
 * Used by API unit tests only — browser code imports the TS module directly.
 */

export const SHELFMERCH_ZOHO_EMBED_AUTH = 'SHELFMERCH_ZOHO_EMBED_AUTH';
export const SHELFMERCH_ZOHO_EMBED_AUTH_ACK = 'SHELFMERCH_ZOHO_EMBED_AUTH_ACK';

export function isZohoEmbedAuthAckMessage(value) {
  if (!value || typeof value !== 'object') return false;
  return value.type === SHELFMERCH_ZOHO_EMBED_AUTH_ACK && typeof value.requestId === 'string';
}

export function sendEmbedAuthAndAwaitAck({
  opener,
  code,
  requestId,
  targetOrigin,
  timeoutMs = 5000,
  intervalMs = 300,
  listenWindow = globalThis,
  scheduleInterval = setInterval,
  clearScheduled = clearInterval,
}) {
  const message = { type: SHELFMERCH_ZOHO_EMBED_AUTH, code, requestId };

  return new Promise((resolve, reject) => {
    let settled = false;
    const started = Date.now();

    const onAck = (event) => {
      if (settled) return;
      if (event.origin !== targetOrigin) return;
      if (!isZohoEmbedAuthAckMessage(event.data)) return;
      if (event.data.requestId !== requestId) return;
      settled = true;
      clearScheduled(intervalId);
      listenWindow.removeEventListener('message', onAck);
      resolve();
    };

    listenWindow.addEventListener('message', onAck);

    const send = () => {
      if (settled) return;
      if (opener.closed) {
        settled = true;
        clearScheduled(intervalId);
        listenWindow.removeEventListener('message', onAck);
        reject(new Error('OPENER_CLOSED'));
        return;
      }
      opener.postMessage(message, targetOrigin);
    };

    const intervalId = scheduleInterval(() => {
      if (settled) return;
      if (Date.now() - started >= timeoutMs) {
        settled = true;
        clearScheduled(intervalId);
        listenWindow.removeEventListener('message', onAck);
        reject(new Error('ACK_TIMEOUT'));
        return;
      }
      send();
    }, intervalMs);

    send();
  });
}
