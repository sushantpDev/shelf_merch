import { useMutation } from "@tanstack/react-query";
import { launchPointsCampaignFlow } from "@/services/api-bridge";
import { useInvalidateWorkspace } from "@/hooks/useWorkspace";
import type { UiCampaign } from "@/services/mappers";

// Ui types re-exported here so views never import from services/ directly.
export type { UiCampaign, UiContact, UiKit, UiWallet } from "@/services/mappers";

export type LaunchPointsCampaignInput = Parameters<typeof launchPointsCampaignFlow>[0];

export function useLaunchPointsCampaign() {
  const invalidate = useInvalidateWorkspace();
  return useMutation({
    mutationFn: (input: LaunchPointsCampaignInput) => launchPointsCampaignFlow(input),
    onSuccess: () => invalidate(),
  });
}

const LIVE_STATUSES = ["live", "launched", "redemption_open"];
export const COMPLETE_STATUSES = ["completed", "redemption_closed", "fulfilled"];

export function isPointsCampaign(c: UiCampaign) {
  return c.type === "send_points" || c.type === "points";
}

export function isLiveCampaign(c: UiCampaign) {
  return isPointsCampaign(c) && LIVE_STATUSES.includes(c.status);
}

export function isSentKitCampaign(c: UiCampaign) {
  return !isPointsCampaign(c) && LIVE_STATUSES.includes(c.status);
}
