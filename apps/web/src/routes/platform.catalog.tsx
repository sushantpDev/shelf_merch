import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/platform/PlatformPages";

export const Route = createFileRoute("/platform/catalog")({
  component: CatalogPage,
});
