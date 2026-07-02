import { createFileRoute } from "@tanstack/react-router";
import { SendPointsWizard } from "@/features/campaigns/send-points/SendPointsWizard";
import { requireTenantArea } from "@/services/tenant-route-guards";

export const Route = createFileRoute("/app/campaigns/send-points")({
  beforeLoad: () => requireTenantArea("campaignOps", "write"),
  validateSearch: (search: Record<string, unknown>): { shop?: string } => ({
    shop: typeof search.shop === "string" ? search.shop : undefined,
  }),
  component: SendPointsWizard,
});
