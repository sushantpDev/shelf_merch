import { useTaskManageController } from "../controllers/useTaskManageController";
import { TaskManageModalView } from "./TaskManageModalView";

/** Thin binding for the production task manage modal widget. */
export function TaskManageModal({
  row,
  onClose,
  onChanged,
}: {
  row: Record<string, unknown>;
  onClose: () => void;
  onChanged: () => void;
}) {
  const vm = useTaskManageController(row, onClose, onChanged);
  return <TaskManageModalView {...vm} />;
}
