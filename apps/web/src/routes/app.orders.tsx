import { createFileRoute } from "@tanstack/react-router";
import { OrdersPage } from "@/features/orders/OrdersPage";

export const Route = createFileRoute("/app/orders")({
  component: OrdersPage,
});
