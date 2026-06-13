import { createFileRoute } from "@tanstack/react-router";
import { TenantsPage } from "@/components/platform/PlatformPages";

export const Route = createFileRoute("/platform/tenants")({
  component: TenantsPage,
});
