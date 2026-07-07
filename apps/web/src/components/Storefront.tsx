import { useStorefrontController } from "./public/controllers/useStorefrontController";
import { StorefrontView } from "./public/views/StorefrontView";

export default function Storefront({ shopId }: { shopId: string }) {
  const vm = useStorefrontController(shopId);
  return <StorefrontView {...vm} shopId={shopId} />;
}
