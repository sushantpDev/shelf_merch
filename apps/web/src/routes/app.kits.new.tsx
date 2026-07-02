import { createFileRoute } from "@tanstack/react-router";
import { KitWizard } from "@/features/kits/wizard/KitWizard";
import { requireTenantArea } from "@/services/tenant-route-guards";

export const Route = createFileRoute("/app/kits/new")({
  beforeLoad: () => requireTenantArea("kits", "write"),
  validateSearch: (search: Record<string, unknown>): { template?: string } => ({
    template: typeof search.template === "string" ? search.template : undefined,
  }),
  component: KitWizard,
});
