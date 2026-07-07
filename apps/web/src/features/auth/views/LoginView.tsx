import { Eye, EyeOff } from "lucide-react";
import type { LoginVm } from "../controllers/useLoginController";
import { AuthLabel, AuthLayout, authInputClassName } from "./AuthLayout";

export function LoginView(vm: LoginVm) {
  return (
    <AuthLayout
      title="Log in with your Shelf Merch account"
      footerLink={{ hint: "Don't have an account?", label: "Sign up", to: "/signup" }}
    >
      <form className="auth-simple-form" onSubmit={vm.onSubmit} aria-busy={vm.busy}>
        <fieldset className="auth-simple-fieldset" disabled={vm.busy}>
        <div className="auth-simple-field">
          <AuthLabel htmlFor="login-email">Email</AuthLabel>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={vm.email}
            onChange={(e) => vm.onEmail(e.target.value)}
            className={authInputClassName}
            autoFocus
          />
        </div>

        <div className="auth-simple-field">
          <AuthLabel
            htmlFor="login-password"
            action={
              <button
                type="button"
                className="auth-simple-label-action"
                onClick={vm.onForgotPassword}
              >
                Reset password
              </button>
            }
          >
            Password
          </AuthLabel>
          <div className="auth-simple-input-wrap">
            <input
              id="login-password"
              type={vm.showPassword ? "text" : "password"}
              autoComplete="current-password"
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

        {vm.error ? (
          <p className="auth-simple-error" role="alert">
            {vm.error}
          </p>
        ) : null}

        <button type="submit" className="auth-simple-submit">
          {vm.busy ? "Signing in…" : "Log in"}
        </button>
        </fieldset>
      </form>
    </AuthLayout>
  );
}
