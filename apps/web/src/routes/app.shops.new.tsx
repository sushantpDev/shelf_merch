import { createFileRoute } from "@tanstack/react-router";
import { CreateShopWizard } from "@/features/shops/CreateShopWizard";
import { requireTenantArea } from "@/services/tenant-route-guards";

export const Route = createFileRoute("/app/shops/new")({
  beforeLoad: () => requireTenantArea("shops", "write"),
  component: CreateShopWizard,
});
