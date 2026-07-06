import { useProductionController } from "./controllers/useProductionController";
import { ProductionView } from "./views/ProductionView";

export function ProductionPage() {
  const vm = useProductionController();
  return <ProductionView {...vm} />;
}
