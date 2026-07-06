import { useInventoryManageController } from "../controllers/useInventoryManageController";
import type { InventoryRow } from "../model";
import { InventoryManageModalView } from "./InventoryManageModalView";

/** Thin binding for the inventory manage modal widget. */
export function InventoryManageModal({
  row,
  onClose,
  onChanged,
}: {
  row: InventoryRow;
  onClose: () => void;
  onChanged: () => void;
}) {
  const vm = useInventoryManageController(row, onClose, onChanged);
  return <InventoryManageModalView {...vm} />;
}
