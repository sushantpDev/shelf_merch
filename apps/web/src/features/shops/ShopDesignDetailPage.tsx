import { useShopDesignDetailController } from "./controllers/useShopDesignDetailController";
import { ShopDesignDetailView } from "./views/ShopDesignDetailView";

export function ShopDesignDetailPage() {
  const vm = useShopDesignDetailController();
  return <ShopDesignDetailView {...vm} />;
}
