import { Link } from "react-router";

type Props = {
  open: boolean;
  countdownLabel: string;
  onResetPassword: () => void;
  onBack: () => void;
};

export function AccountLockedModal({ open, countdownLabel, onResetPassword, onBack }: Props) {
  if (!open) return null;

  return (
    <div className="auth-lock-scrim" role="presentation">
      <div
        className="auth-lock-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="auth-lock-title"
        aria-describedby="auth-lock-desc"
      >
        <h2 id="auth-lock-title" className="auth-lock-title">
          Account Temporarily Locked
        </h2>
        <p id="auth-lock-desc" className="auth-lock-desc">
          For your security, your account has been temporarily locked after multiple unsuccessful
          login attempts.
        </p>
        <p className="auth-lock-options">You can:</p>
        <ul className="auth-lock-list">
          <li>
            Wait <strong>1 minute</strong> and try again
          </li>
          <li>OR reset your password immediately</li>
        </ul>

        <div className="auth-lock-countdown" aria-live="polite" aria-atomic="true">
          <span className="auth-lock-countdown-label">Try again in</span>
          <span className="auth-lock-countdown-time">{countdownLabel}</span>
        </div>

        <div className="auth-lock-actions">
          <button type="button" className="auth-simple-submit" onClick={onResetPassword}>
            Reset Password
          </button>
          <button type="button" className="auth-simple-secondary" onClick={onBack}>
            Back
          </button>
        </div>

        <p className="auth-lock-foot">
          Need help?{" "}
          <Link to="/login" className="auth-simple-switch-link" onClick={onBack}>
            Return to login
          </Link>
        </p>
      </div>
    </div>
  );
}

export function formatCountdown(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
