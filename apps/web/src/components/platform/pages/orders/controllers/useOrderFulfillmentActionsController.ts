import { useEffect, useState } from "react";
import {
  addOrderNote,
  assignOrderVendor,
  createOrderReplacement,
  fetchPlatformVendors,
  setOrderStatus,
  uploadOrderMockup,
} from "../model";

export type OrderFulfillmentActionsVm = {
  currentStatus: string;
  status: string;
  statusNote: string;
  internalNote: string;
  vendors: { _id: string; name: string }[];
  vendorId: string;
  mockupUrl: string;
  replacementReason: string;
  busy: boolean;
  err: string;
  okNote: string;
  onStatus: (status: string) => void;
  onStatusNote: (note: string) => void;
  onInternalNote: (note: string) => void;
  onVendorId: (id: string) => void;
  onMockupUrl: (url: string) => void;
  onReplacementReason: (reason: string) => void;
  onSaveStatus: () => void;
  onAssignVendor: () => void;
  onAddNote: () => void;
  onAttachMockup: () => void;
  onCreateReplacement: () => void;
};

/** Controller for the order fulfilment actions panel: status/vendor/note/mockup/replacement. */
export function useOrderFulfillmentActionsController(
  order: Record<string, unknown>,
  onChanged: () => void,
): OrderFulfillmentActionsVm {
  const id = String(order._id);
  const currentStatus = String(order.status ?? "created");
  const [status, setStatus] = useState(currentStatus);
  const [statusNote, setStatusNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [vendors, setVendors] = useState<{ _id: string; name: string }[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [mockupUrl, setMockupUrl] = useState("");
  const [replacementReason, setReplacementReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [okNote, setOkNote] = useState("");

  useEffect(() => {
    fetchPlatformVendors()
      .then(setVendors)
      .catch(() => setVendors([]));
  }, []);

  useEffect(() => {
    setStatus(String(order.status ?? "created"));
  }, [order.status]);

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
    currentStatus,
    status,
    statusNote,
    internalNote,
    vendors,
    vendorId,
    mockupUrl,
    replacementReason,
    busy,
    err,
    okNote,
    onStatus: setStatus,
    onStatusNote: setStatusNote,
    onInternalNote: setInternalNote,
    onVendorId: setVendorId,
    onMockupUrl: setMockupUrl,
    onReplacementReason: setReplacementReason,
    onSaveStatus: () =>
      run(() => setOrderStatus(id, status, statusNote || undefined), "Status updated."),
    onAssignVendor: () => run(() => assignOrderVendor(id, vendorId), "Vendor assigned."),
    onAddNote: () => run(() => addOrderNote(id, internalNote.trim()), "Note added."),
    onAttachMockup: () => run(() => uploadOrderMockup(id, mockupUrl.trim()), "Mockup attached."),
    onCreateReplacement: () =>
      run(() => createOrderReplacement(id, replacementReason.trim()), "Replacement created."),
  };
}
