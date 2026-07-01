import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/shops/$id")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  component: Outlet,
});
