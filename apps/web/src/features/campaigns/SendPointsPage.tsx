import { useSendPointsController } from "./controllers/useSendPointsController";
import { SendPointsView } from "./views/SendPointsView";

export function SendPointsPage() {
  const vm = useSendPointsController();
  return <SendPointsView {...vm} />;
}
