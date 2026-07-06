import { useState } from "react";
import {
  adjustInventory,
  setInventoryMode,
  type InventoryRow,
  type InventoryTxnType,
} from "../model";

export type InventoryManageVm = {
  row: InventoryRow;
  mode: "physical" | "made_to_order";
  threshold: number;
  txnType: InventoryTxnType;
  qty: number;
  reason: string;
  busy: boolean;
  err: string;
  note: string;
  onClose: () => void;
  onMode: (mode: "physical" | "made_to_order") => void;
  onThreshold: (threshold: number) => void;
  onTxnType: (type: InventoryTxnType) => void;
  onQty: (qty: number) => void;
  onReason: (reason: string) => void;
  onSaveMode: () => void;
  onApplyStock: () => void;
};

/** Controller for the inventory manage modal: mode, threshold, and stock adjustments. */
export function useInventoryManageController(
  row: InventoryRow,
  onClose: () => void,
  onChanged: () => void,
): InventoryManageVm {
  const [mode, setMode] = useState<"physical" | "made_to_order">(
    row.mode === "made_to_order" ? "made_to_order" : "physical",
  );
  const [threshold, setThreshold] = useState(row.lowStockThreshold);
  const [txnType, setTxnType] = useState<InventoryTxnType>("add");
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  async function saveMode() {
    setBusy(true);
    setErr("");
    setNote("");
    try {
      await setInventoryMode(row.productId, { mode, lowStockThreshold: threshold });
      setNote("Mode & threshold saved.");
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update mode");
    } finally {
      setBusy(false);
    }
  }

  async function applyStock() {
    if (qty === 0) {
      setErr("Enter a quantity.");
      return;
    }
    if (!reason.trim()) {
      setErr("Add a reason for the change.");
      return;
    }
    setBusy(true);
    setErr("");
    setNote("");
    try {
      await adjustInventory(row.productId, {
        type: txnType,
        qty: Math.abs(qty),
        reason: reason.trim(),
      });
      setNote("Stock updated.");
      setQty(0);
      setReason("");
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update stock");
    } finally {
      setBusy(false);
    }
  }

  return {
    row,
    mode,
    threshold,
    txnType,
    qty,
    reason,
    busy,
    err,
    note,
    onClose,
    onMode: setMode,
    onThreshold: setThreshold,
    onTxnType: setTxnType,
    onQty: setQty,
    onReason: setReason,
    onSaveMode: saveMode,
    onApplyStock: applyStock,
  };
}
