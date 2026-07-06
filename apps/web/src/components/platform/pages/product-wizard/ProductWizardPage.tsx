import { useLocation, useParams } from "react-router";
import { useProductWizardController } from "./controllers/useProductWizardController";
import { ProductWizardView } from "./views/ProductWizardView";

/** Route target for platform product create/edit wizard. */
export function ProductWizard() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const mode = pathname.endsWith("/new") ? "create" : "edit";
  const vm = useProductWizardController(mode, mode === "edit" ? id : undefined);
  return <ProductWizardView {...vm} />;
}
