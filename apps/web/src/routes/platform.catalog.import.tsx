import { createFileRoute } from "@tanstack/react-router";
import { ShopifyImport } from "@/components/platform/ShopifyImport";

export const Route = createFileRoute("/platform/catalog/import")({
  component: ShopifyImport,
});
