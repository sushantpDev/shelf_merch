import { createFileRoute } from "@tanstack/react-router";
import { SwagWizard } from "@/features/swag/wizard/SwagWizard";
import { requireTenantArea } from "@/services/tenant-route-guards";

export const Route = createFileRoute("/app/swag/new")({
  beforeLoad: () => requireTenantArea("swag", "write"),
  validateSearch: (search: Record<string, unknown>): { shop?: string } => ({
    shop: typeof search.shop === "string" ? search.shop : undefined,
  }),
  component: SwagWizard,
});
