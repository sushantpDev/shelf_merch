import { createFileRoute } from "@tanstack/react-router";
import TenantLayout from "@/components/tenant/TenantLayout";

export const Route = createFileRoute("/app")({
  component: TenantLayout,
});
