import { createFileRoute } from "@tanstack/react-router";
import { WalletsPage } from "@/features/wallets/WalletsPage";

export const Route = createFileRoute("/app/wallets")({
  component: WalletsPage,
});
