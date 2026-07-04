import { useState } from "react";
import { toast } from "sonner";
import { login, isPlatformUser, ApiError } from "../model";

export type LoginVm = {
  email: string;
  password: string;
  showPassword: boolean;
  busy: boolean;
  error: string;
  onEmail: (email: string) => void;
  onPassword: (password: string) => void;
  onToggleShowPassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
  onGoogleSignIn: () => void;
};

function loginErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 502 || err.status === 503) {
      return "Cannot reach the server. Start the API with npm run dev:api.";
    }
    return err.message;
  }
  if (err instanceof TypeError) {
    return "Cannot reach the server. Start the API with npm run dev:api.";
  }
  return err instanceof Error ? err.message : "Login failed";
}

/** Controller for the login screen: form state, submit flow, redirect by role. */
export function useLoginController(): LoginVm {
  const [email, setEmail] = useState("hr@rubix.net");
  const [password, setPassword] = useState("demo1234");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      toast.error("Enter email and password");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const user = await login(trimmedEmail, password);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
      const destination = isPlatformUser(user) ? "/platform/dashboard" : "/app/orders";
      window.location.assign(destination);
    } catch (err) {
      setBusy(false);
      const message = loginErrorMessage(err);
      setError(message);
      toast.error(message);
    }
  }

  return {
    email,
    password,
    showPassword,
    busy,
    error,
    onEmail: setEmail,
    onPassword: setPassword,
    onToggleShowPassword: () => setShowPassword((s) => !s),
    onSubmit: submit,
    onForgotPassword: () => toast("Reset link sent"),
    onGoogleSignIn: () => toast("Google sign-in coming soon"),
  };
}
