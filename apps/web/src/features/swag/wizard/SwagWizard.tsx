import { useSwagWizardController } from "../controllers/useSwagWizardController";
import { SwagWizardView } from "../views/SwagWizardView";

export function SwagWizard() {
  const vm = useSwagWizardController();
  return <SwagWizardView {...vm} />;
}
