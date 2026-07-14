import { useParams } from "react-router";
import { useOrderFulfillmentController } from "./controllers/useOrderFulfillmentController";
import { OrderFulfillmentView } from "./views/OrderFulfillmentView";

/** Route target for platform order fulfilment detail. */
export function OrderFulfillmentPage() {
  const { id } = useParams() as { id: string };
  const vm = useOrderFulfillmentController(id);
  return <OrderFulfillmentView {...vm} />;
}
