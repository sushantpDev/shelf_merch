import { createFileRoute } from "@tanstack/react-router";
import { ShopsPage } from "@/features/shops/ShopsPage";

export const Route = createFileRoute("/app/shops/")({
  component: ShopsPage,
});
