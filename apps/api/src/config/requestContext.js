import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * §Gap F — request-scoped context (requestId, tenantId, userId) propagated via
 * AsyncLocalStorage so every log line emitted anywhere during a request can be
 * correlated without threading a logger through every call.
 */
export const requestContext = new AsyncLocalStorage();

export function getRequestContext() {
  return requestContext.getStore();
}

/** Merge fields into the current request's context (no-op outside a request). */
export function setRequestContext(fields) {
  const store = requestContext.getStore();
  if (store) Object.assign(store, fields);
}
