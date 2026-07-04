import { useOrdersController } from "./controllers/useOrdersController";
import { OrdersView } from "./views/OrdersView";

export function OrdersPage() {
  const vm = useOrdersController();
  return <OrdersView {...vm} />;
}
