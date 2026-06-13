import { createFileRoute } from "@tanstack/react-router";
import { ShipmentsPage } from "@/components/platform/PlatformPages";

export const Route = createFileRoute("/platform/shipments")({
  component: ShipmentsPage,
});
