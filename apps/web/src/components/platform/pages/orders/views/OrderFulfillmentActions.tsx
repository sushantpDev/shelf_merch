import { useOrderFulfillmentActionsController } from "../controllers/useOrderFulfillmentActionsController";
import { OrderFulfillmentActionsView } from "./OrderFulfillmentActionsView";

/** Thin binding for the fulfilment actions panel widget. */
export function OrderFulfillmentActions({
  order,
  onChanged,
}: {
  order: Record<string, unknown>;
  onChanged: () => void;
}) {
  const vm = useOrderFulfillmentActionsController(order, onChanged);
  return <OrderFulfillmentActionsView {...vm} />;
}
