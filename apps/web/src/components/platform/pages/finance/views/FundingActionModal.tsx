import { useFundingActionController } from "../controllers/useFundingActionController";
import type { FundingRow } from "../model";
import { FundingActionModalView } from "./FundingActionModalView";

/** Thin binding for the funding action modal widget. */
export function FundingActionModal({
  row,
  mode,
  onClose,
  onDone,
}: {
  row: FundingRow;
  mode: "approve" | "reject";
  onClose: () => void;
  onDone: () => void;
}) {
  const vm = useFundingActionController(row, mode, onClose, onDone);
  return <FundingActionModalView {...vm} />;
}
