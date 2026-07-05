import { PlatformError } from "../../../platform-ui";
import { ORDER_STATUSES } from "../model";
import type { OrderFulfillmentActionsVm } from "../controllers/useOrderFulfillmentActionsController";

/** Fulfilment actions panel: status / vendor / note / mockup / replacement. */
export function OrderFulfillmentActionsView(vm: OrderFulfillmentActionsVm) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="h1" style={{ fontSize: 16, marginBottom: 16 }}>
        Fulfillment actions
      </div>
      {vm.err && <PlatformError message={vm.err} />}
      {vm.okNote && (
        <div
          className="card"
          style={{ padding: 10, marginBottom: 12, color: "var(--brand)", fontSize: 13 }}
        >
          {vm.okNote}
        </div>
      )}

      <div className="field">
        <label className="lbl">Status</label>
        <select className="inp" value={vm.status} onChange={(e) => vm.onStatus(e.target.value)}>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <input
        className="inp"
        placeholder="Note (optional)"
        value={vm.statusNote}
        onChange={(e) => vm.onStatusNote(e.target.value)}
      />
      <button
        type="button"
        className="btn btn-soft btn-sm"
        style={{ marginTop: 10 }}
        disabled={vm.busy || vm.status === vm.currentStatus}
        onClick={vm.onSaveStatus}
      >
        Save status
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <div className="field">
        <label className="lbl">Assign production vendor</label>
        <select className="inp" value={vm.vendorId} onChange={(e) => vm.onVendorId(e.target.value)}>
          <option value="">Select a vendor…</option>
          {vm.vendors.map((v) => (
            <option key={v._id} value={v._id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="btn btn-soft btn-sm"
        disabled={vm.busy || !vm.vendorId}
        onClick={vm.onAssignVendor}
      >
        Assign vendor
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <div className="field">
        <label className="lbl">Internal note</label>
        <input
          className="inp"
          placeholder="Add an internal note"
          value={vm.internalNote}
          onChange={(e) => vm.onInternalNote(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={vm.busy || !vm.internalNote.trim()}
        onClick={vm.onAddNote}
      >
        Add note
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <div className="field">
        <label className="lbl">Mockup image URL</label>
        <input
          className="inp"
          placeholder="https://…"
          value={vm.mockupUrl}
          onChange={(e) => vm.onMockupUrl(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={vm.busy || !vm.mockupUrl.trim()}
        onClick={vm.onAttachMockup}
      >
        Attach mockup
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <div className="field">
        <label className="lbl">Create replacement (reason)</label>
        <input
          className="inp"
          placeholder="Why a replacement is needed"
          value={vm.replacementReason}
          onChange={(e) => vm.onReplacementReason(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        style={{ color: "var(--danger)" }}
        disabled={vm.busy || !vm.replacementReason.trim()}
        onClick={vm.onCreateReplacement}
      >
        Create replacement order
      </button>
    </div>
  );
}
