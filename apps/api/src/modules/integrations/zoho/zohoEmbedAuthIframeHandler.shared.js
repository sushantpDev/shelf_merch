/**
 * Testable iframe embed-auth dedup handler (mirrors web zoho-embed-messaging.ts).
 */

export function createEmbedAuthDedupState() {
  return {
    inFlightRequestIds: new Set(),
    completedRequestIds: new Set(),
  };
}

export async function handleEmbedAuthMessage(state, message, deps) {
  const { requestId, code } = message;

  if (state.completedRequestIds.has(requestId)) {
    deps.sendAck(requestId);
    return 'ack_only';
  }

  if (state.inFlightRequestIds.has(requestId)) {
    return 'ignored_in_flight';
  }

  state.inFlightRequestIds.add(requestId);
  deps.onExchangeStart?.();

  try {
    await deps.exchange(code, requestId);
  } catch (error) {
    state.inFlightRequestIds.delete(requestId);
    if (state.completedRequestIds.has(requestId)) {
      deps.sendAck(requestId);
      return 'ack_only';
    }
    deps.onExchangeFailure(error);
    return 'failed';
  }

  state.inFlightRequestIds.delete(requestId);
  state.completedRequestIds.add(requestId);
  deps.sendAck(requestId);
  await deps.onExchangeSuccess();
  return 'exchanged';
}
