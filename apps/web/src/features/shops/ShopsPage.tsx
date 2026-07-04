import { useShopsController } from "./controllers/useShopsController";
import { ShopsView } from "./views/ShopsView";

export function ShopsPage() {
  const vm = useShopsController();
  return <ShopsView {...vm} />;
}
