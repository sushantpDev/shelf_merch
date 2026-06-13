import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/platform/PlatformPages";

export const Route = createFileRoute("/platform/dashboard")({
  component: DashboardPage,
});
