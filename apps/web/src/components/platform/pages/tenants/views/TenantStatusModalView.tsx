import { PlatformError, PlatformModal } from "../../../platform-ui";
import { formatTenantStatus } from "../model";
import type { TenantStatusModalVm } from "../controllers/useTenantStatusController";

function impactCopy(status: string, name: string) {
  if (status === "suspended") {
    return {
      title: `Suspend ${name}?`,
      body: "Tenant users will lose access to protected tenant functionality. Existing orders, wallet records and tenant data will remain unchanged. ShelfMerch platform admins will retain access.",
      confirm: "Suspend tenant",
      destructive: true,
    };
  }
  if (status === "archived") {
    return {
      title: `Archive ${name}?`,
      body: "The tenant will be removed from the default active tenant list. Tenant data will be retained. The tenant can be restored later by a platform administrator.",
      confirm: "Archive tenant",
      destructive: true,
    };
  }
  return {
    title: `Restore ${name}?`,
    body: "The tenant will return to active status. Tenant users will regain access to protected functionality.",
    confirm: "Restore tenant",
    destructive: false,
  };
}

/** Status-only manage modal with impact copy and required reason. */
export function TenantStatusModalView(vm: TenantStatusModalVm) {
  const { row, status, reason, options, busy, err, canSubmit, onClose, onStatus, onReason, onSubmit } =
    vm;
  const impact = impactCopy(status, row.name);

  return (
    <PlatformModal
      title={impact.title}
      subtitle={`@${row.slug} · Current: ${formatTenantStatus(row.status)}`}
      onClose={onClose}
      closeDisabled={busy}
    >
      {err && <PlatformError message={err} />}

      <p className="muted" style={{ fontSize: 13, marginBottom: 14, lineHeight: 1.45 }}>
        {impact.body}
      </p>

      <div className="field">
        <label className="lbl" htmlFor="tenant-new-status">
          New status
        </label>
        <select
          id="tenant-new-status"
          className="inp"
          value={status}
          disabled={busy}
          onChange={(e) => onStatus(e.target.value as typeof status)}
        >
          {options.map((s) => (
            <option key={s} value={s}>
              {formatTenantStatus(s)}
            </option>
          ))}
        </select>
      </div>

      <div className="field" style={{ marginTop: 12 }}>
        <label className="lbl" htmlFor="tenant-status-reason">
          Reason
        </label>
        <textarea
          id="tenant-status-reason"
          className="inp"
          rows={3}
          required
          disabled={busy}
          placeholder="Required for the audit log"
          value={reason}
          onChange={(e) => onReason(e.target.value)}
        />
      </div>

      <div className="row" style={{ gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-sm"
          style={
            impact.destructive
              ? { background: "var(--danger)", color: "#fff", borderColor: "var(--danger)" }
              : undefined
          }
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          {busy ? "Saving…" : impact.confirm}
        </button>
      </div>
    </PlatformModal>
  );
}
