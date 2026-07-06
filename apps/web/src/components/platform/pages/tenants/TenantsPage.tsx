import { useTenantsController } from "./controllers/useTenantsController";
import { TenantsView } from "./views/TenantsView";

export function TenantsPage() {
  const vm = useTenantsController();
  return <TenantsView {...vm} />;
}
