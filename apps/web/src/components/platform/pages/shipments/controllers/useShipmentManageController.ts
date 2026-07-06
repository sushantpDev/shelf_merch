import { useState } from "react";
import { addShipmentEvent, resendShipmentTracking, updateShipment } from "../model";

export type ShipmentManageVm = {
  row: Record<string, unknown>;
  shipmentId: string;
  evStatus: string;
  location: string;
  evNote: string;
  courier: string;
  awb: string;
  busy: boolean;
  err: string;
  okNote: string;
  onClose: () => void;
  onEvStatus: (status: string) => void;
  onLocation: (location: string) => void;
  onEvNote: (note: string) => void;
  onCourier: (courier: string) => void;
  onAwb: (awb: string) => void;
  onAddEvent: () => void;
  onSaveChanges: () => void;
  onResendTracking: () => void;
};

/** Controller for the shipment manage modal. */
export function useShipmentManageController(
  row: Record<string, unknown>,
  onClose: () => void,
  onChanged: () => void,
): ShipmentManageVm {
  const shipmentId = String(row._id);
  const [evStatus, setEvStatus] = useState(String(row.status ?? "pending"));
  const [location, setLocation] = useState("");
  const [evNote, setEvNote] = useState("");
  const [courier, setCourier] = useState(String(row.courier ?? ""));
  const [awb, setAwb] = useState(String(row.awb ?? ""));
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
    shipmentId,
    evStatus,
    location,
    evNote,
    courier,
    awb,
    busy,
    err,
    okNote,
    onClose,
    onEvStatus: setEvStatus,
    onLocation: setLocation,
    onEvNote: setEvNote,
    onCourier: setCourier,
    onAwb: setAwb,
    onAddEvent: () =>
      run(
        () =>
          addShipmentEvent(shipmentId, {
            status: evStatus,
            location: location || undefined,
            note: evNote || undefined,
          }),
        "Event added.",
      ),
    onSaveChanges: () =>
      run(
        () => updateShipment(shipmentId, { courier: courier.trim(), awb: awb.trim() }),
        "Shipment updated.",
      ),
    onResendTracking: () => run(() => resendShipmentTracking(shipmentId), "Tracking email resent."),
  };
}
