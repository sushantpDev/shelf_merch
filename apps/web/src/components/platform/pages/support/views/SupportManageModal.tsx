import { useSupportManageController } from "../controllers/useSupportManageController";
import { SupportManageModalView } from "./SupportManageModalView";

/** Thin binding for the support manage modal widget. */
export function SupportManageModal({
  row,
  onClose,
  onChanged,
}: {
  row: Record<string, unknown>;
  onClose: () => void;
  onChanged: () => void;
}) {
  const vm = useSupportManageController(row, onClose, onChanged);
  return <SupportManageModalView {...vm} />;
}
