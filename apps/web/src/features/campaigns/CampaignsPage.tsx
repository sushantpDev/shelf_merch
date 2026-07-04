import { useCampaignsController } from "./controllers/useCampaignsController";
import { CampaignsView } from "./views/CampaignsView";

export function CampaignsPage() {
  const vm = useCampaignsController();
  return <CampaignsView {...vm} />;
}
