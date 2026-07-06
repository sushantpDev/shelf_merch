import { useDashboardController } from "./controllers/useDashboardController";
import { DashboardView } from "./views/DashboardView";

export function DashboardPage() {
  const vm = useDashboardController();
  return <DashboardView {...vm} />;
}
