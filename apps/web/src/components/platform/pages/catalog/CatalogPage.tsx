import { useCatalogController } from "./controllers/useCatalogController";
import { CatalogView } from "./views/CatalogView";

export function CatalogPage() {
  const vm = useCatalogController();
  return <CatalogView {...vm} />;
}
