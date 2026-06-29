import { createFileRoute } from "@tanstack/react-router";
import { EditKitWizard } from "@/features/kits/wizard/EditKitWizard";

export const Route = createFileRoute("/app/kits/$id/edit")({
  component: EditKitWizard,
});
