import { createFileRoute } from "@tanstack/react-router";
import { KitsPage } from "@/components/platform/PlatformPages";

export const Route = createFileRoute("/platform/kits")({
  component: KitsPage,
});
