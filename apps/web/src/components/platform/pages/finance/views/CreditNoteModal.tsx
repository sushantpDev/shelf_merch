import { useCreditNoteController } from "../controllers/useCreditNoteController";
import type { PlatformInvoice } from "../model";
import { CreditNoteModalView } from "./CreditNoteModalView";

/** Thin binding for the credit note modal. */
export function CreditNoteModal({
  invoice,
  onClose,
  onDone,
}: {
  invoice: PlatformInvoice;
  onClose: () => void;
  onDone: () => void;
}) {
  const vm = useCreditNoteController(invoice, onClose, onDone);
  return <CreditNoteModalView {...vm} />;
}
