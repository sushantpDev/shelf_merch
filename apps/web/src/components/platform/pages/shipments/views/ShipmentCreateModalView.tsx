import { PlatformError, PlatformModal } from "../../../platform-ui";
import type { ShipmentCreateVm } from "../controllers/useShipmentCreateController";

/** New shipment creation modal. */
export function ShipmentCreateModalView({
  orderId,
  courier,
  awb,
  trackingUrl,
  busy,
  err,
  onClose,
  onOrderId,
  onCourier,
  onAwb,
  onTrackingUrl,
  onSubmit,
}: ShipmentCreateVm) {
  return (
    <PlatformModal title="New shipment" onClose={onClose}>
      {err && <PlatformError message={err} />}
      <div className="field">
        <label className="lbl">Order ID</label>
        <input className="inp" value={orderId} onChange={(e) => onOrderId(e.target.value)} />
      </div>
      <div className="field">
        <label className="lbl">Courier</label>
        <input className="inp" value={courier} onChange={(e) => onCourier(e.target.value)} />
      </div>
      <div className="field">
        <label className="lbl">AWB</label>
        <input className="inp" value={awb} onChange={(e) => onAwb(e.target.value)} />
      </div>
      <div className="field">
        <label className="lbl">Tracking URL (optional)</label>
        <input
          className="inp"
          value={trackingUrl}
          onChange={(e) => onTrackingUrl(e.target.value)}
        />
      </div>
      <button type="button" className="btn btn-brand btn-block" disabled={busy} onClick={onSubmit}>
        {busy ? "Creating…" : "Create shipment"}
      </button>
    </PlatformModal>
  );
}
