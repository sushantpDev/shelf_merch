import { createFileRoute } from "@tanstack/react-router";
import Storefront from "@/components/Storefront";

export const Route = createFileRoute("/shop/$id")({
  component: ShopPage,
});

function ShopPage() {
  const { id } = Route.useParams();
  return <Storefront shopId={id} />;
}
