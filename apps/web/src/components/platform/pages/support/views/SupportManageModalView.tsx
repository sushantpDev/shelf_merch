import { PlatformError, PlatformModal } from "../../../platform-ui";
import { SUPPORT_TICKET_STATUSES } from "../model";
import type { SupportManageVm } from "../controllers/useSupportManageController";

/** Support ticket manage modal: conversation, status, assign, reply, resend links. */
export function SupportManageModalView({
  row,
  ticket,
  messages,
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
  const tenantName = String(ticket?.tenantName ?? "");
  const raisedByName = String(ticket?.raisedByName ?? "");
  const description = String(ticket?.description ?? row.description ?? "");
  return (
    <PlatformModal
      title={String(row.subject ?? "Ticket")}
      subtitle={[String(row.type ?? ""), tenantName, raisedByName && `raised by ${raisedByName}`]
        .filter(Boolean)
        .join(" · ")}
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

      {description && (
        <p className="muted" style={{ fontSize: 13, whiteSpace: "pre-wrap", marginBottom: 12 }}>
          {description}
        </p>
      )}

      <div className="field">
        <label className="lbl">Conversation</label>
        {messages.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>
            No messages yet.
          </p>
        ) : (
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {messages.map((m, i) => (
              <div
                key={m._id ?? i}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  marginBottom: 6,
                  opacity: m.internal ? 0.75 : 1,
                }}
              >
                <div className="row" style={{ justifyContent: "space-between", fontSize: 12 }}>
                  <strong>
                    {m.fromPlatform === false
                      ? m.authorName || "Customer"
                      : m.authorName || "Agent"}
                    {m.internal ? " · internal note" : ""}
                  </strong>
                  <span className="muted">
                    {new Date(m.at).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <div style={{ fontSize: 13, whiteSpace: "pre-wrap", marginTop: 3 }}>{m.body}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="divider" style={{ margin: "18px 0" }} />

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
