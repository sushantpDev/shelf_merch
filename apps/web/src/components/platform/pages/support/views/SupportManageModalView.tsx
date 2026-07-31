import { Lock, Paperclip } from "lucide-react";
import { PlatformError, PlatformModal, PlatformSelect } from "../../../platform-ui";
import { SUPPORT_TICKET_STATUSES } from "../model";
import type { SupportManageVm, TicketMessage } from "../controllers/useSupportManageController";

function statusLabel(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatMsgTime(at: string) {
  return new Date(at).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ThreadMessage({
  message,
  hideInternalBadge,
}: {
  message: TicketMessage;
  hideInternalBadge?: boolean;
}) {
  const isCustomer = message.fromPlatform === false;
  const isInternal = Boolean(message.internal);
  const author = isCustomer
    ? message.authorName || "Customer"
    : message.authorName || "Support";

  const kind = isInternal ? "internal" : isCustomer ? "customer" : "agent";

  return (
    <div className={`st-msg st-msg--${kind}`}>
      <div className="st-msg-avatar" aria-hidden="true">
        {initials(author)}
      </div>
      <div className="st-msg-bubble">
        <div className="st-msg-meta">
          <span className="st-msg-author">
            {author}
            {isInternal && !hideInternalBadge ? (
              <span className="st-msg-badge">
                <Lock size={10} strokeWidth={2.5} aria-hidden="true" />
                Internal
              </span>
            ) : null}
          </span>
          <time className="st-msg-time" dateTime={message.at}>
            {formatMsgTime(message.at)}
          </time>
        </div>
        <div className="st-msg-body">{message.body}</div>
      </div>
    </div>
  );
}

/** Support ticket manage modal: conversation + actions in a wide two-column layout. */
export function SupportManageModalView({
  row,
  ticket,
  messages,
  status,
  team,
  assignee,
  reply,
  internal,
  canWrite,
  assigneeOnly,
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
}: SupportManageVm) {
  const tenantName = String(ticket?.tenantName ?? "");
  const raisedByName = String(ticket?.raisedByName ?? "");
  const description = String(ticket?.description ?? row.description ?? "");
  const attachments = (ticket?.attachments ?? []) as Array<{
    _id?: string;
    url: string;
    name?: string;
  }>;

  const statusOptions = SUPPORT_TICKET_STATUSES.map((s) => ({
    value: s,
    label: statusLabel(s),
  }));
  const teamOptions = team.map((m) => ({
    value: m.userId,
    label: m.role
      ? `${m.name} (${m.role.replace(/^platform_/, "").replace(/_/g, " ")})`
      : m.name,
  }));

  // Assignees only see the internal Support ↔ department thread.
  const visibleMessages = assigneeOnly ? messages.filter((m) => m.internal) : messages;

  return (
    <PlatformModal
      size="lg"
      title={String(row.subject ?? "Ticket")}
      subtitle={[String(row.type ?? ""), tenantName, raisedByName && `raised by ${raisedByName}`]
        .filter(Boolean)
        .join(" · ")}
      onClose={onClose}
    >
      <div className="support-manage-body">
      {err && <PlatformError message={err} />}
      {okNote && (
        <div
          className="card"
          style={{ padding: 10, marginBottom: 12, color: "var(--brand)", fontSize: 13 }}
        >
          {okNote}
        </div>
      )}

      {!assigneeOnly && (description || attachments.length > 0) && (
        <div className="support-manage-intro">
          {description ? (
            <p className="muted" style={{ fontSize: 13, whiteSpace: "pre-wrap", margin: 0 }}>
              {description}
            </p>
          ) : null}
          {attachments.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: description ? 8 : 0 }}>
              {attachments.map((a, i) => (
                <a
                  key={String(a._id ?? i)}
                  href={String(a.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lnk"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                  }}
                >
                  <Paperclip size={14} strokeWidth={2.25} aria-hidden="true" />
                  {String(a.name || "Attachment")}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="support-ticket-layout">
        <div className="support-ticket-thread">
          <label className="lbl">{assigneeOnly ? "Notes with Support" : "Conversation"}</label>
          <div className="support-ticket-thread-scroll">
            {visibleMessages.length === 0 ? (
              <p className="support-ticket-thread-empty">
                {assigneeOnly ? "No internal notes yet." : "No messages yet."}
              </p>
            ) : (
              visibleMessages.map((m, i) => (
                <ThreadMessage
                  key={m._id ?? i}
                  message={m}
                  hideInternalBadge={assigneeOnly}
                />
              ))
            )}
          </div>
        </div>

        <div className="support-ticket-side">
          {canWrite ? (
            <>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="lbl">Status</label>
                <div className="support-ticket-select-row">
                  <PlatformSelect
                    className="platform-select"
                    value={status}
                    onChange={onStatus}
                    options={statusOptions}
                    placeholder="Select status…"
                  />
                  <button
                    type="button"
                    className="btn btn-soft btn-sm"
                    disabled={busy || status === String(ticket?.status ?? row.status)}
                    onClick={onSaveStatus}
                  >
                    Update status
                  </button>
                </div>
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label className="lbl">Assign to</label>
                <p className="muted" style={{ fontSize: 12, margin: "0 0 8px" }}>
                  {ticket?.assigneeName
                    ? `Handed to ${String(ticket.assigneeName)}. They can exchange internal notes with Support; customer messages stay with the help desk.`
                    : "Hand off to a department for internal work. Assignees can write back on the internal thread; customer conversation stays with Support."}
                </p>
                <div className="support-ticket-select-row">
                  <PlatformSelect
                    className="platform-select"
                    value={assignee}
                    onChange={onAssignee}
                    options={teamOptions}
                    placeholder="Select a team member…"
                  />
                  <button
                    type="button"
                    className="btn btn-soft btn-sm"
                    disabled={busy || !assignee || assignee === String(ticket?.assignedToUserId ?? "")}
                    onClick={onAssign}
                  >
                    {ticket?.assignedToUserId ? "Reassign" : "Assign"}
                  </button>
                </div>
                {team.length === 0 && !err ? (
                  <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                    No active team members available to assign.
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <p className="muted" style={{ fontSize: 12, margin: 0 }}>
              You are the assignee. Only notes with Support are shown here — customer chat stays with
              the help desk.
            </p>
          )}

          <div className="field" style={{ marginBottom: 0 }}>
            <label className="lbl">{assigneeOnly ? "Internal note to Support" : "Reply"}</label>
            <textarea
              className="inp"
              rows={3}
              value={reply}
              onChange={(e) => onReply(e.target.value)}
            />
            {!assigneeOnly ? (
              <label
                className="row support-private-note"
                style={{ gap: 6, alignItems: "center", marginTop: 6 }}
              >
                <input
                  type="checkbox"
                  checked={internal}
                  onChange={(e) => onInternal(e.target.checked)}
                />{" "}
                <span>Private note for assigned team only. Admin will not see this.</span>
              </label>
            ) : null}
            <button
              type="button"
              className="btn btn-brand btn-sm"
              style={{ marginTop: 10 }}
              disabled={busy || !reply.trim()}
              onClick={onSendReply}
            >
              {assigneeOnly ? "Send note" : "Send reply"}
            </button>
          </div>
        </div>
      </div>
      </div>
    </PlatformModal>
  );
}
