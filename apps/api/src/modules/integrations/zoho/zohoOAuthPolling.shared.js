/** Testable OAuth polling helper (mirrors web zoho-oauth-polling.ts). */

export function oauthLaunchSafeErrorMessage(errorCode) {
  const messages = {
    OAUTH_DENIED: 'Zoho authorization was denied.',
    OAUTH_STATE_INVALID: 'Zoho authorization could not be verified. Please try again.',
    OAUTH_CODE_MISSING: 'Zoho authorization was incomplete. Please try again.',
    OAUTH_CONNECTION_FAILED: 'Could not connect Zoho People. Please try again.',
  };
  if (!errorCode) return 'Could not connect Zoho People.';
  return messages[errorCode] ?? 'Could not connect Zoho People.';
}

export function startOAuthLaunchPolling({
  requestId,
  poll,
  getPopup,
  isFinished,
  onCompleted,
  onFailed,
  onPopupClosedEarly,
  intervalMs = 1000,
  timeoutMs = 2 * 60 * 1000,
  scheduleInterval = setInterval,
  clearScheduled = clearInterval,
  now = () => Date.now(),
}) {
  let stopped = false;
  const started = now();

  const stop = () => {
    stopped = true;
    clearScheduled(intervalId);
  };

  const tick = async () => {
    if (stopped || isFinished(requestId)) {
      stop();
      return;
    }

    const popup = getPopup();
    if (popup?.closed) {
      stop();
      try {
        const result = await poll(requestId);
        if (result.status === 'completed') {
          onCompleted();
          return;
        }
      } catch {
        // fall through
      }
      onPopupClosedEarly();
      return;
    }

    if (now() - started >= timeoutMs) {
      stop();
      return;
    }

    try {
      const result = await poll(requestId);
      if (result.status === 'completed') {
        stop();
        onCompleted();
      } else if (result.status === 'failed') {
        stop();
        onFailed(oauthLaunchSafeErrorMessage(result.errorCode));
      }
    } catch {
      // keep polling
    }
  };

  const intervalId = scheduleInterval(() => {
    void tick();
  }, intervalMs);
  void tick();

  return { stop };
}
