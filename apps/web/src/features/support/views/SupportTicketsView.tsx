import { LifeBuoy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/tenant/PageHeader";
import { StatusTag } from "@/components/platform/platform-ui";
import { SUPPORT_TICKET_TYPES, TYPE_LABELS, type SupportMessage } from "../model";
import type { SupportTicketsVm } from "../controllers/useSupportTicketsController";

const SUBTITLE = "Raise an issue with the ShelfMerch team and track replies here.";

function MessageBubble({ message }: { message: SupportMessage }) {
  const fromSupport = message.fromPlatform !== false;
  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: "var(--r-sm)",
        padding: "10px 12px",
        marginBottom: 8,
        background: fromSupport ? "var(--bg-2, transparent)" : "transparent",
      }}
    >
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>
          {fromSupport ? message.authorName || "Support team" : message.authorName || "You"}
        </span>
        <span className="muted" style={{ fontSize: 12 }}>
          {new Date(message.at).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </span>
      </div>
      <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{message.body}</div>
    </div>
  );
}

/** Tenant help center: my tickets + raise-ticket dialog + conversation thread. */
export function SupportTicketsView(vm: SupportTicketsVm) {
  if (vm.isLoading) {
    return <LoadingState message="Loading support tickets…" fullScreen={false} />;
  }
  if (vm.errorMessage) {
    return (
      <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
        {vm.errorMessage}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Support"
        subtitle={SUBTITLE}
        actions={
          <button type="button" className="btn btn-brand" onClick={vm.onOpenCreate}>
            Raise a ticket
          </button>
        }
      />

      {vm.tickets.length === 0 ? (
        <div className="card empty">
          <div className="ic" aria-hidden="true">
            <LifeBuoy size={34} color="var(--ink-3)" />
          </div>
          <h3>No tickets yet</h3>
          <p>Stuck on an order, delivery or redemption? Raise a ticket and we&apos;ll help.</p>
          <button type="button" className="btn btn-brand" onClick={vm.onOpenCreate}>
            Raise a ticket
          </button>
        </div>
      ) : (
        <div className="card data-list-card">
          <div className="data-list-title">Your tickets</div>
          <table className="tbl data-list-table">
            <thead>
              <tr>
                <th>Opened</th>
                <th>Subject</th>
                <th>Type</th>
                <th>Status</th>
                <th>Replies</th>
              </tr>
            </thead>
            <tbody>
              {vm.tickets.map((t) => (
                <tr
                  key={t._id}
                  className="data-list-row"
                  onClick={() => vm.onSelect(t)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open ticket ${t.subject}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      vm.onSelect(t);
                    }
                  }}
                >
                  <td className="muted data-list-cell">
                    {new Date(t.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="data-list-cell">
                    <div className="data-list-primary">{t.subject}</div>
                  </td>
                  <td className="data-list-cell">{TYPE_LABELS[t.type] ?? t.type}</td>
                  <td className="data-list-cell">
                    <StatusTag status={t.status} />
                  </td>
                  <td className="data-list-cell">{t.messages?.length ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Raise-ticket dialog */}
      <Dialog open={vm.creating} onOpenChange={vm.onCreateOpenChange}>
        <DialogContent className="sm-modal">
          <div className="modal-pad">
            <DialogHeader>
              <DialogTitle style={{ fontSize: 18 }}>Raise a support ticket</DialogTitle>
              <DialogDescription>
                Tell us what went wrong — the team replies right here.
              </DialogDescription>
            </DialogHeader>
            <div style={{ marginTop: 14 }}>
              <div className="field">
                <label className="lbl" htmlFor="support-subject">
                  Subject
                </label>
                <input
                  id="support-subject"
                  className="inp"
                  placeholder="e.g. Order SM-1042 not delivered"
                  value={vm.subject}
                  onChange={(e) => vm.onSubject(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="lbl" htmlFor="support-type">
                  Category
                </label>
                <select
                  id="support-type"
                  className="inp"
                  value={vm.type}
                  onChange={(e) => vm.onType(e.target.value as typeof vm.type)}
                >
                  {SUPPORT_TICKET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="lbl" htmlFor="support-description">
                  Details
                </label>
                <textarea
                  id="support-description"
                  className="inp"
                  rows={4}
                  placeholder="Share order numbers, recipient emails or anything that helps us dig in."
                  value={vm.description}
                  onChange={(e) => vm.onDescription(e.target.value)}
                />
              </div>
              <div className="row" style={{ justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => vm.onCreateOpenChange(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-brand"
                  disabled={vm.submitting || !vm.subject.trim()}
                  onClick={vm.onSubmit}
                >
                  {vm.submitting ? "Raising…" : "Raise ticket"}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket detail / conversation dialog */}
      <Dialog open={vm.selected !== null} onOpenChange={vm.onDetailOpenChange}>
        <DialogContent className="sm-modal">
          {vm.selected && (
            <div className="modal-pad">
              <DialogHeader>
                <div className="eyebrow">
                  {TYPE_LABELS[vm.selected.type] ?? vm.selected.type} ·{" "}
                  {new Date(vm.selected.createdAt).toLocaleDateString("en-IN")}
                </div>
                <DialogTitle style={{ fontSize: 18 }}>{vm.selected.subject}</DialogTitle>
                <DialogDescription className="sr-only">
                  Conversation for ticket {vm.selected.subject}
                </DialogDescription>
              </DialogHeader>

              <div style={{ marginTop: 10, marginBottom: 12 }}>
                <StatusTag status={vm.selected.status} />
              </div>

              {vm.selected.description ? (
                <div
                  className="muted"
                  style={{ fontSize: 14, whiteSpace: "pre-wrap", marginBottom: 14 }}
                >
                  {vm.selected.description}
                </div>
              ) : null}

              <div className="lbl" style={{ marginBottom: 8 }}>
                Conversation
              </div>
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {(vm.selected.messages ?? []).length === 0 ? (
                  <p className="muted" style={{ fontSize: 13 }}>
                    No replies yet — the team has been notified.
                  </p>
                ) : (
                  vm.selected.messages.map((m, i) => (
                    <MessageBubble key={m._id ?? i} message={m} />
                  ))
                )}
              </div>

              {vm.canReply ? (
                <div style={{ marginTop: 12 }}>
                  <textarea
                    className="inp"
                    rows={3}
                    placeholder="Write a reply…"
                    value={vm.reply}
                    onChange={(e) => vm.onReply(e.target.value)}
                  />
                  <div className="row" style={{ justifyContent: "flex-end", marginTop: 8 }}>
                    <button
                      type="button"
                      className="btn btn-brand btn-sm"
                      disabled={vm.replying || !vm.reply.trim()}
                      onClick={vm.onSendReply}
                    >
                      {vm.replying ? "Sending…" : "Send reply"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
                  This ticket is closed. Raise a new ticket if you need more help.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
