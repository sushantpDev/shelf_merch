import { createFileRoute } from "@tanstack/react-router";
import { SwagProductPage } from "@/features/swag/SwagProductPage";

export const Route = createFileRoute("/app/swag/$collectionId/$pIdx")({
  component: SwagProductPage,
});
