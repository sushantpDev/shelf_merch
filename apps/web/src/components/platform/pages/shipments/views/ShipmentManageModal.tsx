import { useShipmentManageController } from "../controllers/useShipmentManageController";
import { ShipmentManageModalView } from "./ShipmentManageModalView";

/** Thin binding for the shipment manage modal widget. */
export function ShipmentManageModal({
  row,
  onClose,
  onChanged,
}: {
  row: Record<string, unknown>;
  onClose: () => void;
  onChanged: () => void;
}) {
  const vm = useShipmentManageController(row, onClose, onChanged);
  return <ShipmentManageModalView {...vm} />;
}
