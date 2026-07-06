import { useLocation, useParams } from "react-router";
import { useKitWizardController } from "./controllers/useKitWizardController";
import { KitWizardView } from "./views/KitWizardView";

/** Route target for platform kit create/edit wizard. */
export function KitWizard() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const mode = pathname.endsWith("/new") ? "create" : "edit";
  const vm = useKitWizardController(mode, mode === "edit" ? id : undefined);
  return <KitWizardView {...vm} />;
}
