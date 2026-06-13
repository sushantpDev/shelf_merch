import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/platform/PlatformPages";

export const Route = createFileRoute("/platform/settings")({
  component: SettingsPage,
});
