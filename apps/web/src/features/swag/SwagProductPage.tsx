import { useSwagProductController } from "./controllers/useSwagProductController";
import { SwagProductView } from "./views/SwagProductView";

export function SwagProductPage() {
  const vm = useSwagProductController();
  return <SwagProductView {...vm} />;
}
