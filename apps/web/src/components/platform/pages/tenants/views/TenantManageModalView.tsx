import { PlatformError, PlatformModal } from "../../../platform-ui";
import { TENANT_PLANS, TENANT_STATUSES } from "../model";
import type { TenantManageVm } from "../controllers/useTenantManageController";

/** Tenant manage modal: account status and plan. */
export function TenantManageModalView({
  row,
  status,
  reason,
  plan,
  busy,
  err,
  note,
  onClose,
  onStatus,
  onReason,
  onPlan,
  onSaveStatus,
  onSavePlan,
}: TenantManageVm) {
  return (
    <PlatformModal title={row.name} subtitle={`@${row.slug}`} onClose={onClose}>
      {err && <PlatformError message={err} />}
      {note && (
        <div
          className="card"
          style={{ padding: 10, marginBottom: 12, color: "var(--brand)", fontSize: 13 }}
        >
          {note}
        </div>
      )}

      <div className="field">
        <label className="lbl">Account status</label>
        <select className="inp" value={status} onChange={(e) => onStatus(e.target.value)}>
          {TENANT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <input
        className="inp"
        placeholder="Reason (optional, for the audit log)"
        value={reason}
        onChange={(e) => onReason(e.target.value)}
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

      <div className="field">
        <label className="lbl">Plan</label>
        <select className="inp" value={plan} onChange={(e) => onPlan(e.target.value)}>
          {TENANT_PLANS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="btn btn-soft btn-sm"
        disabled={busy || plan === row.plan}
        onClick={onSavePlan}
      >
        Save plan
      </button>
    </PlatformModal>
  );
}
