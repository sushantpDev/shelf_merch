import { createFileRoute } from "@tanstack/react-router";
import { BillingPage } from "@/features/billing/BillingPage";

export const Route = createFileRoute("/app/billing")({
  component: BillingPage,
});
