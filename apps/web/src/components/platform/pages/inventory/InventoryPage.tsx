import { useInventoryController } from "./controllers/useInventoryController";
import { InventoryView } from "./views/InventoryView";

export function InventoryPage() {
  const vm = useInventoryController();
  return <InventoryView {...vm} />;
}
