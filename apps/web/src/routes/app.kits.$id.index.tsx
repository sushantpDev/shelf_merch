import { createFileRoute } from "@tanstack/react-router";
import { KitDetailPage } from "@/features/kits/KitDetailPage";

export const Route = createFileRoute("/app/kits/$id/")({
  component: KitDetailPage,
});
