import { useTeamManageController } from "../controllers/useTeamManageController";
import type { TeamRow } from "../model";
import { TeamManageModalView } from "./TeamManageModalView";

/** Thin binding for the team manage modal widget. */
export function TeamManageModal({
  row,
  onClose,
  onChanged,
}: {
  row: TeamRow;
  onClose: () => void;
  onChanged: () => void;
}) {
  const vm = useTeamManageController(row, onClose, onChanged);
  return <TeamManageModalView {...vm} />;
}
