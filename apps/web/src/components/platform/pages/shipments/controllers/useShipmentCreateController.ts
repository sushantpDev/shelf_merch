import { useState } from "react";
import { createShipment } from "../model";

export type ShipmentCreateVm = {
  orderId: string;
  courier: string;
  awb: string;
  trackingUrl: string;
  busy: boolean;
  err: string;
  onClose: () => void;
  onOrderId: (orderId: string) => void;
  onCourier: (courier: string) => void;
  onAwb: (awb: string) => void;
  onTrackingUrl: (url: string) => void;
  onSubmit: () => void;
};

/** Controller for the new shipment modal. */
export function useShipmentCreateController(
  onClose: () => void,
  onDone: () => void,
): ShipmentCreateVm {
  const [orderId, setOrderId] = useState("");
  const [courier, setCourier] = useState("");
  const [awb, setAwb] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!orderId.trim() || !courier.trim() || !awb.trim()) {
      setErr("Order ID, courier and AWB are required.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await createShipment({
        orderId: orderId.trim(),
        courier: courier.trim(),
        awb: awb.trim(),
        trackingUrl: trackingUrl.trim() || undefined,
      });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create shipment");
      setBusy(false);
    }
  }

  return {
    orderId,
    courier,
    awb,
    trackingUrl,
    busy,
    err,
    onClose,
    onOrderId: setOrderId,
    onCourier: setCourier,
    onAwb: setAwb,
    onTrackingUrl: setTrackingUrl,
    onSubmit: submit,
  };
}
