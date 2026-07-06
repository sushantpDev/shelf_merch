import { useTeamInviteController } from "../controllers/useTeamInviteController";
import { TeamInviteModalView } from "./TeamInviteModalView";

/** Thin binding for the team invite modal widget. */
export function TeamInviteModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const vm = useTeamInviteController(onClose, onDone);
  return <TeamInviteModalView {...vm} />;
}
