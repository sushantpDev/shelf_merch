import { createFileRoute } from "@tanstack/react-router";
import { ShopDetailPage } from "@/features/shops/ShopDetailPage";

export const Route = createFileRoute("/app/shops/$id/")({
  component: ShopDetailPage,
});
