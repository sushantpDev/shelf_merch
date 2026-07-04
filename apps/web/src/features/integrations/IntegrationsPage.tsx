import { useIntegrationsController } from "./controllers/useIntegrationsController";
import { IntegrationsView } from "./views/IntegrationsView";

export function IntegrationsPage() {
  const vm = useIntegrationsController();
  return <IntegrationsView {...vm} />;
}
