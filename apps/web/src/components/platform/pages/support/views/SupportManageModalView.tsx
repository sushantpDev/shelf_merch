import { PlatformError, PlatformModal } from "../../../platform-ui";
import { SUPPORT_TICKET_STATUSES } from "../model";
import type { SupportManageVm } from "../controllers/useSupportManageController";

/** Support ticket manage modal: status, assign, reply, resend links. */
export function SupportManageModalView({
  row,
  status,
  team,
  assignee,
  reply,
  internal,
  busy,
  err,
  okNote,
  onClose,
  onStatus,
  onAssignee,
  onReply,
  onInternal,
  onSaveStatus,
  onAssign,
  onSendReply,
  onResendRedemption,
  onResendTracking,
}: SupportManageVm) {
  return (
    <PlatformModal
      title={String(row.subject ?? "Ticket")}
      subtitle={String(row.type ?? "")}
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
        <label className="lbl">Status</label>
        <select className="inp" value={status} onChange={(e) => onStatus(e.target.value)}>
          {SUPPORT_TICKET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="btn btn-soft btn-sm"
        disabled={busy || status === row.status}
        onClick={onSaveStatus}
      >
        Save status
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <div className="field">
        <label className="lbl">Assign to</label>
        <select className="inp" value={assignee} onChange={(e) => onAssignee(e.target.value)}>
          <option value="">Select a team member…</option>
          {team.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="btn btn-soft btn-sm"
        disabled={busy || !assignee}
        onClick={onAssign}
      >
        Assign
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <div className="field">
        <label className="lbl">Reply</label>
        <textarea
          className="inp"
          rows={3}
          value={reply}
          onChange={(e) => onReply(e.target.value)}
        />
        <label className="row" style={{ gap: 6, alignItems: "center", fontSize: 13, marginTop: 6 }}>
          <input
            type="checkbox"
            checked={internal}
            onChange={(e) => onInternal(e.target.checked)}
          />{" "}
          Internal note (not sent to customer)
        </label>
      </div>
      <button
        type="button"
        className="btn btn-brand btn-sm"
        disabled={busy || !reply.trim()}
        onClick={onSendReply}
      >
        Send reply
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <div className="row" style={{ gap: 8 }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={busy}
          onClick={onResendRedemption}
        >
          Resend redemption link
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={busy}
          onClick={onResendTracking}
        >
          Resend tracking link
        </button>
      </div>
    </PlatformModal>
  );
}
