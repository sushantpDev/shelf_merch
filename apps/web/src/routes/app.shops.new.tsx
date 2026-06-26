import { createFileRoute } from "@tanstack/react-router";
import { CreateShopWizard } from "@/features/shops/CreateShopWizard";

export const Route = createFileRoute("/app/shops/new")({
  component: CreateShopWizard,
});
