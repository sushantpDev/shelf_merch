import { createFileRoute } from "@tanstack/react-router";
import { KitsPage } from "@/features/kits/KitsPage";

export const Route = createFileRoute("/app/kits")({
  component: KitsPage,
});
