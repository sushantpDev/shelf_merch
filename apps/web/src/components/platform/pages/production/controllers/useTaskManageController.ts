import { useState } from "react";
import { PRODUCTION_TASK_STATUSES, recordTaskQc, setTaskStatus } from "../model";

export type TaskManageVm = {
  row: Record<string, unknown>;
  taskId: string;
  status: string;
  note: string;
  qcPassed: boolean;
  qcReason: string;
  busy: boolean;
  err: string;
  okNote: string;
  onClose: () => void;
  onStatus: (status: string) => void;
  onNote: (note: string) => void;
  onQcPassed: (passed: boolean) => void;
  onQcReason: (reason: string) => void;
  onSaveStatus: () => void;
  onRecordQc: () => void;
};

/** Controller for the production task manage modal. */
export function useTaskManageController(
  row: Record<string, unknown>,
  onClose: () => void,
  onChanged: () => void,
): TaskManageVm {
  const taskId = String(row._id);
  const [status, setStatus] = useState(String(row.status ?? "created"));
  const [note, setNote] = useState("");
  const [qcPassed, setQcPassed] = useState(true);
  const [qcReason, setQcReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [okNote, setOkNote] = useState("");

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setErr("");
    setOkNote("");
    try {
      await fn();
      setOkNote(ok);
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return {
    row,
    taskId,
    status,
    note,
    qcPassed,
    qcReason,
    busy,
    err,
    okNote,
    onClose,
    onStatus: setStatus,
    onNote: setNote,
    onQcPassed: setQcPassed,
    onQcReason: setQcReason,
    onSaveStatus: () =>
      run(() => setTaskStatus(taskId, status, note || undefined), "Status updated."),
    onRecordQc: () =>
      run(() => recordTaskQc(taskId, qcPassed, qcReason.trim() || undefined), "QC recorded."),
  };
}
