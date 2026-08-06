import { useState } from "react";
import { allowedNextStatuses, setTenantStatus, type TenantRow } from "../model";

export type TenantStatusModalVm = ReturnType<typeof useTenantStatusController>;

/** Focused Phase 1 status-management modal (no plan controls). */
export function useTenantStatusController(
  row: TenantRow,
  onClose: () => void,
  onChanged: () => void,
) {
  const options = allowedNextStatuses(row.status);
  const [status, setStatus] = useState(options[0] ?? "suspended");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const needsReason = status === "suspended" || status === "archived" || status === "active";
  const canSubmit =
    !busy &&
    status !== row.status &&
    options.includes(status) &&
    (!needsReason || reason.trim().length > 0);

  async function onSubmit() {
    if (!canSubmit) return;
    setBusy(true);
    setErr("");
    try {
      await setTenantStatus(row._id, status, reason.trim() || undefined);
      onChanged();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return {
    row,
    status,
    reason,
    options,
    busy,
    err,
    needsReason,
    canSubmit,
    onClose,
    onStatus: setStatus,
    onReason: setReason,
    onSubmit,
  };
}
