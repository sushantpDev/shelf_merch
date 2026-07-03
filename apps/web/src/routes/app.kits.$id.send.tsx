import { createFileRoute } from "@tanstack/react-router";
import { SendKitWizard } from "@/features/kits/send/SendKitWizard";
import { requireTenantArea } from "@/services/tenant-route-guards";

export const Route = createFileRoute("/app/kits/$id/send")({
  beforeLoad: () => requireTenantArea("campaignOps", "write"),
  component: SendKitWizard,
});
