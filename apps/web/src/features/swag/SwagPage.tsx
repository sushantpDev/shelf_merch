import { useSwagController } from "./controllers/useSwagController";
import { SwagView } from "./views/SwagView";

export function SwagPage() {
  const vm = useSwagController();
  return <SwagView {...vm} />;
}
