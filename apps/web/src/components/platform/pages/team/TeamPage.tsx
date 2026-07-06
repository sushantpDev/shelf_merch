import { useTeamController } from "./controllers/useTeamController";
import { TeamView } from "./views/TeamView";

export function TeamPage() {
  const vm = useTeamController();
  return <TeamView {...vm} />;
}
