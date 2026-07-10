import { Eye, EyeOff } from "lucide-react";
import type { SignupVm } from "../controllers/useSignupController";
import { AuthLabel, AuthLayout, authInputClassName } from "./AuthLayout";
import { GoogleButton } from "./GoogleButton";

export function SignupView(vm: SignupVm) {
  return (
    <AuthLayout
      title="Create your account"
      footerLink={{ hint: "Already have an account?", label: "Log in", to: "/login" }}
    >
      <GoogleButton
        label="Sign up with Google"
        disabled={vm.busy}
        onClick={vm.onGoogleSignUp}
      />

      <div className="auth-simple-divider" aria-hidden>
        <span>or</span>
      </div>

      <form className="auth-simple-form" onSubmit={vm.onSubmit}>
        <div className="auth-simple-name-row">
          <div className="auth-simple-field">
            <AuthLabel htmlFor="signup-first">First name</AuthLabel>
            <input
              id="signup-first"
              type="text"
              autoComplete="given-name"
              placeholder="First name"
              value={vm.firstName}
              onChange={(e) => vm.onFirstName(e.target.value)}
              className={authInputClassName}
              autoFocus
            />
          </div>
          <div className="auth-simple-field">
            <AuthLabel htmlFor="signup-last">Last name</AuthLabel>
            <input
              id="signup-last"
              type="text"
              autoComplete="family-name"
              placeholder="Last name"
              value={vm.lastName}
              onChange={(e) => vm.onLastName(e.target.value)}
              className={authInputClassName}
            />
          </div>
        </div>

        <div className="auth-simple-field">
          <AuthLabel htmlFor="signup-email">Email</AuthLabel>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={vm.email}
            onChange={(e) => vm.onEmail(e.target.value)}
            className={authInputClassName}
          />
        </div>

        <div className="auth-simple-field">
          <AuthLabel htmlFor="signup-company">Company</AuthLabel>
          <input
            id="signup-company"
            type="text"
            autoComplete="organization"
            placeholder="Company name"
            value={vm.company}
            onChange={(e) => vm.onCompany(e.target.value)}
            className={authInputClassName}
          />
        </div>

        <div className="auth-simple-field">
          <AuthLabel htmlFor="signup-password">Password</AuthLabel>
          <div className="auth-simple-input-wrap">
            <input
              id="signup-password"
              type={vm.showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={vm.password}
              onChange={(e) => vm.onPassword(e.target.value)}
              className={`${authInputClassName} auth-simple-input--toggle`}
            />
            <button
              type="button"
              className="auth-simple-toggle"
              onClick={vm.onToggleShowPassword}
              aria-label={vm.showPassword ? "Hide password" : "Show password"}
            >
              {vm.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <p className="auth-simple-legal">
          By proceeding, you agree to Shelf Merch&apos;s{" "}
          <button type="button" className="auth-simple-legal-link">
            Privacy Policy
          </button>{" "}
          and{" "}
          <button type="button" className="auth-simple-legal-link">
            Terms of Use
          </button>
          .
        </p>

        <button type="submit" disabled={vm.busy} className="auth-simple-submit">
          {vm.busy ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
