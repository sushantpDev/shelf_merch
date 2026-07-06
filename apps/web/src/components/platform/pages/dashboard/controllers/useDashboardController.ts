import { usePlatformDashboard } from "../model";

export type DashboardVm = ReturnType<typeof usePlatformDashboard>;

/** Controller for the platform dashboard. */
export function useDashboardController(): DashboardVm {
  return usePlatformDashboard();
}
