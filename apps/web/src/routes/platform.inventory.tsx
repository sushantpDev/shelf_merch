import { createFileRoute } from "@tanstack/react-router";
import { InventoryPage } from "@/components/platform/PlatformPages";

export const Route = createFileRoute("/platform/inventory")({
  component: InventoryPage,
});
