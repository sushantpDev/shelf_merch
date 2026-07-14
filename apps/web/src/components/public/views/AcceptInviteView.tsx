import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router";
import type { AcceptInviteVm } from "../controllers/useAcceptInviteController";

function PasswordField({
  label,
  value,
  placeholder,
  showPassword,
  onChange,
  onToggleShowPassword,
}: {
  label: string;
  value: string;
  placeholder?: string;
  showPassword: boolean;
  onChange: (value: string) => void;
  onToggleShowPassword: () => void;
}) {
  return (
    <div className="field">
      <label className="lbl">{label}</label>
      <div className="inp-wrap">
        <input
          className="inp inp--toggle"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="inp-toggle"
          onClick={onToggleShowPassword}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

/** Accept-invite view: password activation form + login hint on token errors. */
export function AcceptInviteView(vm: AcceptInviteVm) {
  return (
    <div
      className="auth-wrap"
      style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 420, padding: 28 }}>
        <div className="eyebrow">Shelf Merch</div>
        <h1 style={{ fontSize: 24, margin: "8px 0 6px" }}>Accept your invitation</h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>
          Set a password to activate your manager account and access your department budget.
        </p>
        {vm.done ? (
          <p className="muted">Account activated — redirecting…</p>
        ) : (
          <form onSubmit={vm.onSubmit} className="auth-form">
            <PasswordField
              label="Password"
              value={vm.password}
              placeholder="At least 8 characters"
              showPassword={vm.showPassword}
              onChange={vm.onPassword}
              onToggleShowPassword={vm.onToggleShowPassword}
            />
            <PasswordField
              label="Confirm password"
              value={vm.confirm}
              showPassword={vm.showPassword}
              onChange={vm.onConfirm}
              onToggleShowPassword={vm.onToggleShowPassword}
            />
            {vm.error ? (
              <div style={{ marginBottom: 12 }}>
                <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{vm.error}</p>
                {vm.showLoginHint ? (
                  <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                    Already activated?{" "}
                    <Link to="/" className="lnk">
                      Log in here
                    </Link>
                  </p>
                ) : null}
              </div>
            ) : null}
            <button
              className="btn btn-brand btn-block"
              type="submit"
              disabled={vm.loading || !vm.token}
            >
              {vm.loading ? "Activating…" : "Activate account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
