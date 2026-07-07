import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { register, isPlatformUser } from "../model";

export type SignupVm = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company: string;
  showPassword: boolean;
  busy: boolean;
  onEmail: (email: string) => void;
  onPassword: (password: string) => void;
  onFirstName: (firstName: string) => void;
  onLastName: (lastName: string) => void;
  onCompany: (company: string) => void;
  onToggleShowPassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

/** Controller for the signup screen: form state, register flow, redirect by role. */
export function useSignupController(): SignupVm {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
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
        navigate("/platform/dashboard");
      } else {
        navigate("/app/orders");
      }
    } catch (err) {
      setBusy(false);
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    }
  }

  return {
    email,
    password,
    firstName,
    lastName,
    company,
    showPassword,
    busy,
    onEmail: setEmail,
    onPassword: setPassword,
    onFirstName: setFirstName,
    onLastName: setLastName,
    onCompany: setCompany,
    onToggleShowPassword: () => setShowPassword((s) => !s),
    onSubmit: submit,
  };
}
