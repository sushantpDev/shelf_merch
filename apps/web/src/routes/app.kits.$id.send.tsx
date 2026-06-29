import { createFileRoute } from "@tanstack/react-router";
import { SendKitWizard } from "@/features/kits/send/SendKitWizard";

export const Route = createFileRoute("/app/kits/$id/send")({
  component: SendKitWizard,
});
