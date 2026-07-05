import { useWalletsController } from "./controllers/useWalletsController";
import { WalletsView } from "./views/WalletsView";

export function WalletsPage() {
  const screen = useWalletsController();
  return <WalletsView {...screen} />;
}
