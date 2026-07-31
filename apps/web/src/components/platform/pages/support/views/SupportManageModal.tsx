import { useSupportManageController } from "../controllers/useSupportManageController";
import { SupportManageModalView } from "./SupportManageModalView";

/** Thin binding for the support manage modal widget. */
export function SupportManageModal({
  row,
  canWrite = true,
  onClose,
  onChanged,
}: {
  row: Record<string, unknown>;
  canWrite?: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const vm = useSupportManageController(row, onClose, onChanged, canWrite);
  return <SupportManageModalView {...vm} />;
}
