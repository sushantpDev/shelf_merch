import type { OAuthLaunchCompletionStatus } from "@/services/zoho-api";

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
  getPopup: () => Window | null;
  isFinished: (requestId: string) => boolean;
  onCompleted: () => void;
  onFailed: (message: string) => void;
  onPopupClosedEarly: () => void;
  intervalMs?: number;
  timeoutMs?: number;
};

/** Poll OAuth launch completion — used by tests and the iframe controller. */
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

    const popup = getPopup();
    if (popup?.closed) {
      stop();
      try {
        const result = await poll(requestId);
        if (result.status === "completed") {
          onCompleted();
          return;
        }
      } catch {
        // fall through to early-close message
      }
      onPopupClosedEarly();
      return;
    }

    if (Date.now() - started >= timeoutMs) {
      stop();
      return;
    }

    try {
      const result = await poll(requestId);
      if (result.status === "completed") {
        stop();
        onCompleted();
      } else if (result.status === "failed") {
        stop();
        onFailed(oauthLaunchSafeErrorMessage(result.errorCode));
      }
    } catch {
      // keep polling until timeout
    }
  };

  const intervalId = window.setInterval(() => {
    void tick();
  }, intervalMs);
  void tick();

  return { stop };
}
