import { PasswordField } from "../components/PasswordField";
import type { LoginVm } from "../controllers/useLoginController";
import { AuthLabel, AuthLayout, authInputClassName } from "./AuthLayout";

export function LoginView(vm: LoginVm) {
  return (
    <AuthLayout
      title="Log in with your Shelf Merch account"
      footerLink={{ hint: "Don't have an account?", label: "Sign up", to: "/signup" }}
    >
      <form className="auth-simple-form" onSubmit={vm.onSubmit} aria-busy={vm.busy}>
        <fieldset className="auth-simple-fieldset" disabled={vm.loginDisabled}>
          <div className="auth-simple-field">
            <AuthLabel htmlFor="login-email">Work email</AuthLabel>
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
            <PasswordField
              id="login-password"
              value={vm.password}
              onValueChange={vm.onPassword}
              autoComplete="current-password"
            />
          </div>

          {vm.error ? (
            <p className="auth-simple-error auth-simple-error--shake" role="alert">
              {vm.error}
            </p>
          ) : null}

          <button type="submit" className="auth-simple-submit" disabled={vm.loginDisabled}>
            {vm.busy ? "Signing in…" : "Log in"}
          </button>
        </fieldset>
      </form>
    </AuthLayout>
  );
}
