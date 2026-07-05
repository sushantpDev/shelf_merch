import { useOrderFulfillmentController } from "./controllers/useOrderFulfillmentController";
import { OrderFulfillmentView } from "./views/OrderFulfillmentView";

export function OrderFulfillmentPage({ orderId }: { orderId: string }) {
  const vm = useOrderFulfillmentController(orderId);
  return <OrderFulfillmentView {...vm} />;
}
