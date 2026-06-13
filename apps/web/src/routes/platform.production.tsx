import { createFileRoute } from "@tanstack/react-router";
import { ProductionPage } from "@/components/platform/PlatformPages";

export const Route = createFileRoute("/platform/production")({
  component: ProductionPage,
});
