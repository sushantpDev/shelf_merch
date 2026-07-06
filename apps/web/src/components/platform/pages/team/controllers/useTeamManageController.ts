import { useState } from "react";
import { changeTeamRole, deactivateTeamMember, reactivateTeamMember, type TeamRow } from "../model";

export type TeamManageVm = {
  row: TeamRow;
  role: string;
  isActive: boolean;
  busy: boolean;
  err: string;
  note: string;
  onClose: () => void;
  onRole: (role: string) => void;
  onSaveRole: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
};

/** Controller for the team member manage modal. */
export function useTeamManageController(
  row: TeamRow,
  onClose: () => void,
  onChanged: () => void,
): TeamManageVm {
  const [role, setRole] = useState(row.role);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const isActive = row.status === "active";

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setErr("");
    setNote("");
    try {
      await fn();
      setNote(ok);
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return {
    row,
    role,
    isActive,
    busy,
    err,
    note,
    onClose,
    onRole: setRole,
    onSaveRole: () => run(() => changeTeamRole(row.userId, role), "Role updated."),
    onDeactivate: () => run(() => deactivateTeamMember(row.userId), "User deactivated."),
    onReactivate: () => run(() => reactivateTeamMember(row.userId), "User reactivated."),
  };
}
