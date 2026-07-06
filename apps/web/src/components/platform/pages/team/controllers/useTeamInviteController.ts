import { useState } from "react";
import { inviteTeamMember } from "../model";

export type TeamInviteVm = {
  name: string;
  email: string;
  role: string;
  busy: boolean;
  err: string;
  onClose: () => void;
  onName: (name: string) => void;
  onEmail: (email: string) => void;
  onRole: (role: string) => void;
  onSubmit: () => void;
};

/** Controller for the team invite modal. */
export function useTeamInviteController(onClose: () => void, onDone: () => void): TeamInviteVm {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("platform_support_agent");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!name.trim() || !email.trim()) {
      setErr("Name and email are required.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await inviteTeamMember({ name: name.trim(), email: email.trim(), role });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not invite");
      setBusy(false);
    }
  }

  return {
    name,
    email,
    role,
    busy,
    err,
    onClose,
    onName: setName,
    onEmail: setEmail,
    onRole: setRole,
    onSubmit: submit,
  };
}
