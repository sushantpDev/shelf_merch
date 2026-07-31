import { useState } from "react";
import { createCreditNote, type PlatformInvoice } from "../model";

export type CreditNoteVm = {
  invoice: PlatformInvoice;
  amount: number;
  reason: string;
  busy: boolean;
  err: string;
  onClose: () => void;
  onAmount: (amount: number) => void;
  onReason: (reason: string) => void;
  onSubmit: () => void;
};

/** Controller for issuing a credit note against a tax invoice. */
export function useCreditNoteController(
  invoice: PlatformInvoice,
  onClose: () => void,
  onDone: () => void,
): CreditNoteVm {
  const [amount, setAmount] = useState(invoice.totalAmount);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      if (amount <= 0) throw new Error("Enter an amount greater than zero.");
      if (amount > invoice.totalAmount) {
        throw new Error("Amount cannot exceed the invoice total.");
      }
      if (!reason.trim()) throw new Error("A reason is required.");
      await createCreditNote({
        invoiceId: invoice._id,
        amount,
        reason: reason.trim(),
      });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
      setBusy(false);
    }
  }

  return {
    invoice,
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
