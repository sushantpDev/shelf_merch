import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { register, isPlatformUser } from "@/services/api-bridge";
import { AuthArt } from "./AuthArt";
import "@/styles/shelf-merch.css";

export function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || !name || !company) {
      toast.error("Fill in all fields");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      const user = await register({ name, email, password, companyName: company });
      toast.success(`Welcome to Shelf Merch, ${user.name.split(" ")[0]}!`);
      if (isPlatformUser(user)) {
        navigate({ to: "/platform/dashboard" });
      } else {
        navigate({ to: "/app/orders" });
      }
    } catch (err) {
      setBusy(false);
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    }
  }

  return (
    <div className="auth">
      <AuthArt />
      <div className="auth-form">
        <form className="inner stagger" onSubmit={submit}>
          <div className="eyebrow">Get started</div>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Create your account</h1>
          <p className="muted" style={{ marginBottom: 22 }}>
            Set up your Shelf Merch workspace in minutes.
          </p>
          <div className="field">
            <label className="lbl">Work email</label>
            <input
              className="inp"
              type="email"
              placeholder="you@company.com"
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
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label className="lbl">Name</label>
              <input
                className="inp"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label className="lbl">Company</label>
              <input
                className="inp"
                placeholder="Company name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>
          <p className="mut3" style={{ fontSize: 11.5, lineHeight: 1.5, margin: "6px 0 16px" }}>
            By creating an account, I agree to Shelf Merch's <a>Terms of Use</a>, the use of my
            personal data per the <a>Privacy Notice</a>, and to receive product emails from Shelf
            Merch.
          </p>
          <button type="submit" className="btn btn-brand btn-lg btn-block" disabled={busy}>
            {busy ? "Creating your account…" : "Create account"}
          </button>
          <p className="muted" style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
            Already have an account?{" "}
            <Link to="/login" className="lnk">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
