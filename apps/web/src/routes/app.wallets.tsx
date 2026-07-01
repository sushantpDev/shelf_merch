import { createFileRoute } from "@tanstack/react-router";
import { WalletsPage } from "@/features/wallets/WalletsPage";

export const Route = createFileRoute("/app/wallets")({
  validateSearch: (search: Record<string, unknown>): { wallet?: string; addFunds?: string } => ({
    wallet: typeof search.wallet === "string" ? search.wallet : undefined,
    addFunds: typeof search.addFunds === "string" ? search.addFunds : undefined,
  }),
  component: WalletsPage,
});
