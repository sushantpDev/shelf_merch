import type { OAuthLaunchCompletionStatus } from "@/services/zoho-api";

export const OAUTH_LAUNCH_NOT_COMPLETED_MESSAGE =
  "Zoho authorization was not completed.";

const OAUTH_LAUNCH_ERROR_MESSAGES: Record<string, string> = {
  OAUTH_DENIED: "Zoho authorization was denied.",
  OAUTH_STATE_INVALID: "Zoho authorization could not be verified. Please try again.",
  OAUTH_CODE_MISSING: "Zoho authorization was incomplete. Please try again.",
  OAUTH_CONNECTION_FAILED: "Could not connect Zoho People. Please try again.",
};

export function oauthLaunchSafeErrorMessage(errorCode: string | null | undefined): string {
  if (!errorCode) return "Could not connect Zoho People.";
  return OAUTH_LAUNCH_ERROR_MESSAGES[errorCode] ?? "Could not connect Zoho People.";
}

export type OAuthPollingController = {
  stop: () => void;
};

type StartOAuthPollingOptions = {
  requestId: string;
  poll: (requestId: string) => Promise<{ status: OAuthLaunchCompletionStatus; errorCode: string | null }>;
  isFinished: (requestId: string) => boolean;
  onCompleted: () => void;
  onFailed: (message: string) => void;
  onTimeout: () => void;
  intervalMs?: number;
  timeoutMs?: number;
};

/**
 * Poll server-side OAuth launch completion — the only source of truth.
 * Never infers cancellation from popup.closed or inaccessible WindowProxy.
 */
export function startOAuthLaunchPolling({
  requestId,
  poll,
  isFinished,
  onCompleted,
  onFailed,
  onTimeout,
  intervalMs = 1000,
  timeoutMs = 2 * 60 * 1000,
}: StartOAuthPollingOptions): OAuthPollingController {
  let stopped = false;
  const started = Date.now();

  const stop = () => {
    stopped = true;
    window.clearInterval(intervalId);
  };

  const tick = async () => {
    if (stopped || isFinished(requestId)) {
      stop();
      return;
    }

    const timedOut = Date.now() - started >= timeoutMs;

    try {
      const result = await poll(requestId);
      if (result.status === "completed") {
        stop();
        onCompleted();
        return;
      }
      if (result.status === "failed") {
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

  const intervalId = window.setInterval(() => {
    void tick();
  }, intervalMs);
  void tick();

  return { stop };
}

/** Best-effort popup close — COOP may make closed checks throw. */
export function safeClosePopup(popup: Window | null | undefined): void {
  if (!popup) return;
  try {
    popup.close();
  } catch {
    // WindowProxy may be inaccessible during cross-origin navigation.
  }
}
