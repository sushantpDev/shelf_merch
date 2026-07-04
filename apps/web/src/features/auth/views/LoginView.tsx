import { Link } from "react-router";
import { ChevronRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import type { LoginVm } from "../controllers/useLoginController";
import {
  AuthDivider,
  AuthField,
  AuthLayout,
  GoogleSignInButton,
  inputClassName,
  inputWithToggleClassName,
} from "./AuthLayout";

export function LoginView(vm: LoginVm) {
  return (
    <AuthLayout
      headerHint="New here?"
      headerActionLabel="Create an account"
      headerActionTo="/signup"
      cardIcon={Lock}
      eyebrow="Welcome back 👋"
      title="Log in to SwagStore"
      subtitle="Pick up where your team left off."
    >
      <form className="mt-8 space-y-5" onSubmit={vm.onSubmit}>
        <AuthField label="Work email" icon={Mail}>
          <input
            type="email"
            placeholder="hr@rubix.net"
            value={vm.email}
            onChange={(e) => vm.onEmail(e.target.value)}
            className={inputClassName}
            autoFocus
          />
        </AuthField>

        <div>
          <AuthField label="Password" icon={Lock}>
            <input
              type={vm.showPassword ? "text" : "password"}
              value={vm.password}
              onChange={(e) => vm.onPassword(e.target.value)}
              className={inputWithToggleClassName}
            />
            <button
              type="button"
              onClick={vm.onToggleShowPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7a70] hover:text-[#0f4d2e]"
            >
              {vm.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </AuthField>
          <div className="mt-2 text-right">
            <button
              type="button"
              className="text-sm font-medium text-[#0f4d2e] underline"
              onClick={vm.onForgotPassword}
            >
              Forgot password?
            </button>
          </div>
        </div>

        {vm.error ? (
          <p
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {vm.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={vm.busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0f4d2e] py-3.5 text-sm font-semibold text-white transition hover:bg-[#0a3a22] disabled:opacity-60"
        >
          {vm.busy ? "Signing you in…" : "Log in"}{" "}
          {!vm.busy && <ChevronRight className="h-4 w-4" />}
        </button>

        <AuthDivider />
        <GoogleSignInButton onClick={vm.onGoogleSignIn} />

        <p className="text-center text-sm text-[#6b7a70]">
          New here?{" "}
          <Link to="/signup" className="font-medium text-[#0f4d2e] underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
