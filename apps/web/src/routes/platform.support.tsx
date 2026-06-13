import { createFileRoute } from "@tanstack/react-router";
import { SupportPage } from "@/components/platform/PlatformPages";

export const Route = createFileRoute("/platform/support")({
  component: SupportPage,
});
