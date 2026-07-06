import { PlatformError, PlatformModal } from "../../../platform-ui";
import { PRODUCTION_TASK_STATUSES } from "../model";
import type { TaskManageVm } from "../controllers/useTaskManageController";

/** Production task manage modal: status advance and QC. */
export function TaskManageModalView({
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
  onStatus,
  onNote,
  onQcPassed,
  onQcReason,
  onSaveStatus,
  onRecordQc,
}: TaskManageVm) {
  return (
    <PlatformModal
      title={`Task ${taskId.slice(-6)}`}
      subtitle={`Order ${String(row.orderId ?? "").slice(-6)}`}
      onClose={onClose}
    >
      {err && <PlatformError message={err} />}
      {okNote && (
        <div
          className="card"
          style={{ padding: 10, marginBottom: 12, color: "var(--brand)", fontSize: 13 }}
        >
          {okNote}
        </div>
      )}

      <div className="field">
        <label className="lbl">Advance status</label>
        <select className="inp" value={status} onChange={(e) => onStatus(e.target.value)}>
          {PRODUCTION_TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <input
        className="inp"
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => onNote(e.target.value)}
      />
      <button
        type="button"
        className="btn btn-soft btn-sm"
        style={{ marginTop: 10 }}
        disabled={busy || status === row.status}
        onClick={onSaveStatus}
      >
        Save status
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <label className="lbl">Quality check</label>
      <div className="row" style={{ gap: 8, marginBottom: 8 }}>
        <button
          type="button"
          className={qcPassed ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"}
          onClick={() => onQcPassed(true)}
        >
          Pass
        </button>
        <button
          type="button"
          className={!qcPassed ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"}
          onClick={() => onQcPassed(false)}
        >
          Fail
        </button>
      </div>
      {!qcPassed && (
        <input
          className="inp"
          placeholder="Failure reason"
          value={qcReason}
          onChange={(e) => onQcReason(e.target.value)}
        />
      )}
      <button
        type="button"
        className="btn btn-brand btn-sm"
        style={{ marginTop: 10 }}
        disabled={busy || (!qcPassed && !qcReason.trim())}
        onClick={onRecordQc}
      >
        Record QC
      </button>
    </PlatformModal>
  );
}
