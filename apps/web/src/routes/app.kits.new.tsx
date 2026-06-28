import { createFileRoute } from "@tanstack/react-router";
import { KitWizard } from "@/features/kits/wizard/KitWizard";

export const Route = createFileRoute("/app/kits/new")({
  validateSearch: (search: Record<string, unknown>): { template?: string } => ({
    template: typeof search.template === "string" ? search.template : undefined,
  }),
  component: KitWizard,
});
