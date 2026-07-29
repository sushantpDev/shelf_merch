import { useEffect, useRef, useState } from "react";
import { Check, Gift } from "lucide-react";

export type SendingPointsRecipient = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type Props = {
  recipients: SendingPointsRecipient[];
  totalPoints: number;
  isComplete: boolean;
  /** When set, show error UI instead of the sending/success animation. */
  error?: string | null;
  onRetry?: () => void;
  /** e.g. "points" or "credits" */
  unitLabel?: string;
};

/** Send-points loading — ring + gift icon, live count, progress bar, recipient status. */
export function SendingPointsAnimation({
  recipients,
  totalPoints,
  isComplete,
  error = null,
  onRetry,
  unitLabel = "points",
}: Props) {
  const [displayPoints, setDisplayPoints] = useState(0);
  const rafRef = useRef<number | null>(null);
  const displayRef = useRef(0);
  const target = Math.max(0, Math.round(totalPoints));
  const recipientCount = recipients.length;

  const liveMessage = error
    ? error
    : isComplete
      ? `${cap(unitLabel)} sent successfully`
      : `Sending ${unitLabel}`;

  const recipientLine = recipientCount === 1
    ? "Sending to 1 recipient"
    : `Sending to ${recipientCount.toLocaleString("en-IN")} recipients`;

  const statusLine = error
    ? `Couldn't send ${unitLabel}`
    : isComplete
      ? `${cap(unitLabel)} sent`
      : recipientLine;

  useEffect(() => {
    displayRef.current = displayPoints;
  }, [displayPoints]);

  useEffect(() => {
    if (error) {
      setDisplayPoints(0);
      displayRef.current = 0;
      return;
    }

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      const next = isComplete ? target : Math.floor(target * 0.88);
      displayRef.current = next;
      setDisplayPoints(next);
      return;
    }

    const start = performance.now();
    const duration = isComplete ? 420 : 2200;
    const from = displayRef.current;
    const to = isComplete ? target : Math.max(from, Math.floor(target * 0.88));

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      const next = Math.round(from + (to - from) * eased);
      displayRef.current = next;
      setDisplayPoints(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else if (isComplete) {
        displayRef.current = target;
        setDisplayPoints(target);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [isComplete, error, target]);

  const ringState = error ? "spa-ring-wrap--err" : isComplete ? "spa-ring-wrap--done" : "";

  return (
    <div className="spa-root" role="status" aria-live="polite" aria-atomic="true">
      <span className="sr-only">{liveMessage}</span>

      {error ? (
        <div className="spa-meta">
          <p className="spa-title spa-title--err">{statusLine}</p>
          <p className="spa-sub">{error}</p>
          {onRetry ? (
            <button type="button" className="btn btn-brand" style={{ marginTop: 14 }} onClick={onRetry}>
              Back to checkout
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className={`spa-ring-wrap ${ringState}`} aria-hidden="true">
            <svg className="spa-ring-svg" viewBox="0 0 100 100" aria-hidden="true">
              <circle className="spa-ring-track" cx="50" cy="50" r="44" />
              <circle className="spa-ring-progress" cx="50" cy="50" r="44" />
            </svg>
            <div className="spa-ring-icon">
              {isComplete ? (
                <Check size={32} strokeWidth={2.5} />
              ) : (
                <Gift size={28} strokeWidth={2} />
              )}
            </div>
          </div>

          <div className="spa-meta">
            <p className="spa-count num">
              {displayPoints.toLocaleString("en-IN")}
              <span className="spa-count-unit">{unitSuffix(unitLabel)}</span>
            </p>

            <div
              className={`spa-bar ${isComplete ? "spa-bar--done" : "spa-bar--indeterminate"}`}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={isComplete ? 100 : undefined}
              aria-label={isComplete ? "Send complete" : "Sending in progress"}
            >
              <span className="spa-bar-fill" />
            </div>

            <p className="spa-title">
              {isComplete ? (
                <span className="spa-title-row">
                  <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                  {statusLine}
                </span>
              ) : (
                recipientLine
              )}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function unitSuffix(unitLabel: string) {
  const u = unitLabel.toLowerCase();
  if (u.startsWith("point")) return " Pts";
  if (u.startsWith("credit")) return " Credits";
  return ` ${cap(unitLabel)}`;
}
