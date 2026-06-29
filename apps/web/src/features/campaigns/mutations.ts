import { useMutation } from "@tanstack/react-query";
import { launchPointsCampaignFlow } from "@/services/api-bridge";
import { useInvalidateWorkspace } from "@/hooks/useWorkspace";

export type LaunchPointsCampaignInput = Parameters<typeof launchPointsCampaignFlow>[0];

export function useLaunchPointsCampaign() {
  const invalidate = useInvalidateWorkspace();
  return useMutation({
    mutationFn: (input: LaunchPointsCampaignInput) => launchPointsCampaignFlow(input),
    onSuccess: () => invalidate(),
  });
}
