import { useMutation } from "@tanstack/react-query";
import { syncOrgWizard } from "@/services/api-bridge";
import { useInvalidateWorkspace } from "@/hooks/useWorkspace";
import type { WizardState } from "./types";

/**
 * Persist the organization-setup wizard. Creates/updates the wallet, departments
 * and allocations, sends manager invites, then refreshes the workspace snapshot.
 */
export function useSyncOrgWizard() {
  const invalidateWorkspace = useInvalidateWorkspace();
  return useMutation({
    mutationFn: (state: WizardState) =>
      syncOrgWizard({ wallet: state.wallet, departments: state.departments }),
    onSuccess: () => invalidateWorkspace(),
  });
}
