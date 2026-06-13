import { createFileRoute } from "@tanstack/react-router";
import { FinancePage } from "@/components/platform/PlatformPages";

export const Route = createFileRoute("/platform/finance")({
  component: FinancePage,
});
