import { useKitsController } from "./controllers/useKitsController";
import { KitsView } from "./views/KitsView";

export function KitsPage() {
  const vm = useKitsController();
  return <KitsView {...vm} />;
}
