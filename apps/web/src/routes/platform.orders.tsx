import { createFileRoute } from "@tanstack/react-router";
import { OrdersPage } from "@/components/platform/PlatformPages";

export const Route = createFileRoute("/platform/orders")({
  component: OrdersPage,
});
