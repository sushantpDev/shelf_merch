import { useStorefrontController } from "./public/controllers/useStorefrontController";
import { StorefrontView } from "./public/views/StorefrontView";

export default function Storefront({
  shopId,
  slug,
}: {
  shopId?: string;
  slug?: string;
}) {
  const vm = useStorefrontController({ shopId, slug });
  return <StorefrontView {...vm} />;
}
