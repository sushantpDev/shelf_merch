import { createFileRoute } from "@tanstack/react-router";
import { SwagWizard } from "@/features/swag/wizard/SwagWizard";

export const Route = createFileRoute("/app/swag/new")({
  validateSearch: (search: Record<string, unknown>): { shop?: string } => ({
    shop: typeof search.shop === "string" ? search.shop : undefined,
  }),
  component: SwagWizard,
});
