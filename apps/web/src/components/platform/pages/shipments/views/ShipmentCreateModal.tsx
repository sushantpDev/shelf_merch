import { useShipmentCreateController } from "../controllers/useShipmentCreateController";
import { ShipmentCreateModalView } from "./ShipmentCreateModalView";

/** Thin binding for the shipment create modal widget. */
export function ShipmentCreateModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const vm = useShipmentCreateController(onClose, onDone);
  return <ShipmentCreateModalView {...vm} />;
}
