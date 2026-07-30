/** Testable OAuth polling helper (mirrors web zoho-oauth-polling.ts). */

export const OAUTH_LAUNCH_NOT_COMPLETED_MESSAGE =
  'Zoho authorization was not completed.';

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
  isFinished,
  onCompleted,
  onFailed,
  onTimeout,
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

    const timedOut = now() - started >= timeoutMs;

    try {
      const result = await poll(requestId);
      if (result.status === 'completed') {
        stop();
        onCompleted();
        return;
      }
      if (result.status === 'failed') {
        stop();
        onFailed(oauthLaunchSafeErrorMessage(result.errorCode));
        return;
      }
      if (timedOut) {
        stop();
        onTimeout();
      }
    } catch {
      if (timedOut) {
        stop();
        onTimeout();
      }
    }
  };

  const intervalId = scheduleInterval(() => {
    void tick();
  }, intervalMs);
  void tick();

  return { stop };
}

export function safeClosePopup(popup) {
  if (!popup) return;
  try {
    popup.close();
  } catch {
    // WindowProxy may be inaccessible during cross-origin navigation.
  }
}
