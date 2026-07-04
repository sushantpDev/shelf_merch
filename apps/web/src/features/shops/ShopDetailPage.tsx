import { useShopDetailController } from "./controllers/useShopDetailController";
import { ShopDetailView } from "./views/ShopDetailView";

export function ShopDetailPage() {
  const vm = useShopDetailController();
  return <ShopDetailView {...vm} />;
}
