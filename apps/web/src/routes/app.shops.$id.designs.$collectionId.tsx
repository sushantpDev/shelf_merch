import { createFileRoute } from "@tanstack/react-router";
import { ShopDesignDetailPage } from "@/features/shops/ShopDesignDetailPage";

function parseProductIndex(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.max(0, Math.floor(raw));
  if (typeof raw === "string" && /^\d+$/.test(raw)) return Math.max(0, parseInt(raw, 10));
  return 0;
}

export const Route = createFileRoute("/app/shops/$id/designs/$collectionId")({
  validateSearch: (search: Record<string, unknown>): { p: number } => ({
    p: parseProductIndex(search.p),
  }),
  component: ShopDesignDetailPage,
});
