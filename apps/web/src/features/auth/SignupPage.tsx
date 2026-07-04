import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Building2, ChevronRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { register, isPlatformUser } from "@/services/api-bridge";
import {
  AuthDivider,
  AuthField,
  AuthLayout,
  GoogleSignInButton,
  inputClassName,
  inputWithToggleClassName,
} from "./AuthLayout";

export function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      toast.success(`Welcome to SwagStore, ${user.name.split(" ")[0]}!`);
      if (isPlatformUser(user)) {
        navigate("/platform/dashboard");
      } else {
        navigate("/app/orders");
      }
    } catch (err) {
      setBusy(false);
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    }
  }

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
      <form className="mt-8 space-y-5" onSubmit={submit}>
        <AuthField label="Work email" icon={Mail}>
          <input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClassName}
            autoFocus
          />
        </AuthField>

        <div>
          <AuthField label="Password" icon={Lock}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputWithToggleClassName}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7a70] hover:text-[#0f4d2e]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </AuthField>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <AuthField label="Name" icon={User}>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClassName}
            />
          </AuthField>
          <AuthField label="Company" icon={Building2}>
            <input
              type="text"
              placeholder="Company name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
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
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0f4d2e] py-3.5 text-sm font-semibold text-white transition hover:bg-[#0a3a22] disabled:opacity-60"
        >
          {busy ? "Creating your account…" : "Create account"}{" "}
          {!busy && <ChevronRight className="h-4 w-4" />}
        </button>

        <AuthDivider />
        <GoogleSignInButton onClick={() => toast("Google sign-in coming soon")} />

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
