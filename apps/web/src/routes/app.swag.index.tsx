import { createFileRoute } from "@tanstack/react-router";
import { SwagPage } from "@/features/swag/SwagPage";

export const Route = createFileRoute("/app/swag/")({
  component: SwagPage,
});
