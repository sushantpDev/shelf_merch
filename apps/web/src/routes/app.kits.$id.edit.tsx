import { createFileRoute } from "@tanstack/react-router";
import { EditKitWizard } from "@/features/kits/wizard/EditKitWizard";
import { requireTenantArea } from "@/services/tenant-route-guards";

export const Route = createFileRoute("/app/kits/$id/edit")({
  beforeLoad: () => requireTenantArea("kits", "write"),
  component: EditKitWizard,
});
