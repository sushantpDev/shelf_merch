import { Link } from "react-router";
import { Building2, ChevronRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import type { SignupVm } from "../controllers/useSignupController";
import {
  AuthDivider,
  AuthField,
  AuthLayout,
  GoogleSignInButton,
  inputClassName,
  inputWithToggleClassName,
} from "./AuthLayout";

export function SignupView(vm: SignupVm) {
  return (
    <AuthLayout
      headerHint="Already have an account?"
      headerActionLabel="Log in"
      headerActionTo="/login"
      cardIcon={User}
      eyebrow="Get started ✨"
      title="Create your account"
      subtitle="Set up your SwagStore workspace in minutes."
    >
      <form className="mt-8 space-y-5" onSubmit={vm.onSubmit}>
        <AuthField label="Work email" icon={Mail}>
          <input
            type="email"
            placeholder="you@company.com"
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
              placeholder="At least 8 characters"
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
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <AuthField label="Name" icon={User}>
            <input
              type="text"
              placeholder="Your name"
              value={vm.name}
              onChange={(e) => vm.onName(e.target.value)}
              className={inputClassName}
            />
          </AuthField>
          <AuthField label="Company" icon={Building2}>
            <input
              type="text"
              placeholder="Company name"
              value={vm.company}
              onChange={(e) => vm.onCompany(e.target.value)}
              className={inputClassName}
            />
          </AuthField>
        </div>

        <p className="text-[11.5px] leading-relaxed text-[#6b7a70]">
          By creating an account, I agree to SwagStore's{" "}
          <button type="button" className="text-[#0f4d2e] underline">
            Terms of Use
          </button>
          , the use of my personal data per the{" "}
          <button type="button" className="text-[#0f4d2e] underline">
            Privacy Notice
          </button>
          , and to receive product emails from SwagStore.
        </p>

        <button
          type="submit"
          disabled={vm.busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0f4d2e] py-3.5 text-sm font-semibold text-white transition hover:bg-[#0a3a22] disabled:opacity-60"
        >
          {vm.busy ? "Creating your account…" : "Create account"}{" "}
          {!vm.busy && <ChevronRight className="h-4 w-4" />}
        </button>

        <AuthDivider />
        <GoogleSignInButton onClick={vm.onGoogleSignIn} />

        <p className="text-center text-sm text-[#6b7a70]">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-[#0f4d2e] underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
