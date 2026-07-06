import { useState } from "react";
import { approveFunding, rejectFunding, type FundingRow } from "../model";

export type FundingActionVm = {
  row: FundingRow;
  mode: "approve" | "reject";
  amount: number;
  reason: string;
  busy: boolean;
  err: string;
  onClose: () => void;
  onAmount: (amount: number) => void;
  onReason: (reason: string) => void;
  onSubmit: () => void;
};

/** Controller for the funding approve/reject modal. */
export function useFundingActionController(
  row: FundingRow,
  mode: "approve" | "reject",
  onClose: () => void,
  onDone: () => void,
): FundingActionVm {
  const [amount, setAmount] = useState(row.requestedAmount || row.balance || 0);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      if (mode === "approve") {
        if (amount <= 0) throw new Error("Enter an amount greater than zero.");
        await approveFunding(row.walletId, amount);
      } else {
        if (!reason.trim()) throw new Error("A rejection reason is required.");
        await rejectFunding(row.walletId, reason.trim());
      }
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
      setBusy(false);
    }
  }

  return {
    row,
    mode,
    amount,
    reason,
    busy,
    err,
    onClose,
    onAmount: setAmount,
    onReason: setReason,
    onSubmit: submit,
  };
}
