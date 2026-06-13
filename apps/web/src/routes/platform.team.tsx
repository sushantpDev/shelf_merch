import { createFileRoute } from "@tanstack/react-router";
import { TeamPage } from "@/components/platform/PlatformPages";

export const Route = createFileRoute("/platform/team")({
  component: TeamPage,
});
