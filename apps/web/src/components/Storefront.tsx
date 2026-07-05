import { useStorefrontController } from "./public/controllers/useStorefrontController";
import { StorefrontView } from "./public/views/StorefrontView";
import "@/styles/shelf-merch.css";

export default function Storefront({ shopId }: { shopId: string }) {
  const vm = useStorefrontController(shopId);
  return <StorefrontView {...vm} />;
}
