import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router";
import { acceptInvite, ApiError } from "@/services/api-bridge";
import "@/styles/shelf-merch.css";

function readInviteToken(searchToken: string): string {
  const fromSearch = searchToken.trim();
  if (fromSearch) return fromSearch;
  if (typeof window !== "undefined") {
    return new URLSearchParams(window.location.search).get("token")?.trim() ?? "";
  }
  return "";
}

export default function AcceptInvite({ token: searchToken }: { token: string }) {
  const token = useMemo(() => readInviteToken(searchToken), [searchToken]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setErrorCode("");
    if (!token) {
      setError("Invalid invitation link — ask your admin to resend the invite.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await acceptInvite(token, password);
      setDone(true);
      window.location.href = "/";
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setErrorCode(err.code);
      } else {
        setError("Could not accept invitation");
      }
    } finally {
      setLoading(false);
    }
  }

  const showLoginHint =
    errorCode === "INVALID_INVITE_TOKEN" || errorCode === "INVITE_EXPIRED";

  return (
    <div className="auth-wrap" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div className="card" style={{ width: "100%", maxWidth: 420, padding: 28 }}>
        <div className="eyebrow">Shelf Merch</div>
        <h1 style={{ fontSize: 24, margin: "8px 0 6px" }}>Accept your invitation</h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>
          Set a password to activate your manager account and access your department budget.
        </p>
        {done ? (
          <p className="muted">Account activated — redirecting…</p>
        ) : (
          <form onSubmit={onSubmit} className="auth-form">
            <div className="field">
              <label className="lbl">Password</label>
              <input
                className="inp"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="lbl">Confirm password</label>
              <input
                className="inp"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {error ? (
              <div style={{ marginBottom: 12 }}>
                <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p>
                {showLoginHint ? (
                  <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                    Already activated?{" "}
                    <Link to="/" className="lnk">
                      Log in here
                    </Link>
                  </p>
                ) : null}
              </div>
            ) : null}
            <button className="btn btn-brand btn-block" type="submit" disabled={loading || !token}>
              {loading ? "Activating…" : "Activate account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
