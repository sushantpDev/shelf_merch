import { useShipmentsController } from "./controllers/useShipmentsController";
import { ShipmentsView } from "./views/ShipmentsView";

export function ShipmentsPage() {
  const vm = useShipmentsController();
  return <ShipmentsView {...vm} />;
}
