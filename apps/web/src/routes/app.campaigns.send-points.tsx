import { createFileRoute } from "@tanstack/react-router";
import { SendPointsWizard } from "@/features/campaigns/send-points/SendPointsWizard";

export const Route = createFileRoute("/app/campaigns/send-points")({
  validateSearch: (search: Record<string, unknown>): { shop?: string } => ({
    shop: typeof search.shop === "string" ? search.shop : undefined,
  }),
  component: SendPointsWizard,
});
