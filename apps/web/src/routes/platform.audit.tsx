import { createFileRoute } from "@tanstack/react-router";
import { AuditPage } from "@/components/platform/PlatformPages";

export const Route = createFileRoute("/platform/audit")({
  component: AuditPage,
});
