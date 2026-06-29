import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { login, isPlatformUser } from "@/services/api-bridge";
import { AuthArt } from "./AuthArt";
import "@/styles/shelf-merch.css";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("hr@rubix.net");
  const [password, setPassword] = useState("demo1234");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Enter email and password");
      return;
    }
    setBusy(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
      if (isPlatformUser(user)) {
        navigate({ to: "/platform/dashboard" });
      } else {
        navigate({ to: "/app/orders" });
      }
    } catch (err) {
      setBusy(false);
      toast.error(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div className="auth">
      <AuthArt />
      <div className="auth-form">
        <form className="inner stagger" onSubmit={submit}>
          <div className="eyebrow">Welcome back</div>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Log in to Shelf Merch</h1>
          <p className="muted" style={{ marginBottom: 22 }}>
            Pick up where your people team left off.
          </p>
          <div className="field">
            <label className="lbl">Work email</label>
            <input
              className="inp"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field">
            <label className="lbl">Password</label>
            <input
              className="inp"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div style={{ textAlign: "right", marginBottom: 18 }}>
            <button
              type="button"
              className="lnk-muted"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              onClick={() => toast("Reset link sent")}
            >
              Forgot password?
            </button>
          </div>
          <button type="submit" className="btn btn-brand btn-lg btn-block" disabled={busy}>
            {busy ? "Signing you in…" : "Log in"}
          </button>
          <p className="muted" style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
            New here?{" "}
            <Link to="/signup" className="lnk">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
