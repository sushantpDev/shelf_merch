import { useState } from "react";
import { setTenantPlan, setTenantStatus, type TenantRow } from "../model";

export type TenantManageVm = {
  row: TenantRow;
  status: string;
  reason: string;
  plan: string;
  busy: boolean;
  err: string;
  note: string;
  onClose: () => void;
  onStatus: (status: string) => void;
  onReason: (reason: string) => void;
  onPlan: (plan: string) => void;
  onSaveStatus: () => void;
  onSavePlan: () => void;
};

/** Controller for the tenant manage modal: status and plan updates. */
export function useTenantManageController(
  row: TenantRow,
  onClose: () => void,
  onChanged: () => void,
): TenantManageVm {
  const [status, setStatus] = useState(row.status);
  const [reason, setReason] = useState("");
  const [plan, setPlan] = useState(row.plan ?? "trial");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

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
    status,
    reason,
    plan,
    busy,
    err,
    note,
    onClose,
    onStatus: setStatus,
    onReason: setReason,
    onPlan: setPlan,
    onSaveStatus: () =>
      run(() => setTenantStatus(row._id, status, reason || undefined), "Status updated."),
    onSavePlan: () => run(() => setTenantPlan(row._id, plan), "Plan updated."),
  };
}
