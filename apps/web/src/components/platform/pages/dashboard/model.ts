import { fetchPlatformDashboard } from "@/services/platform-api";
import { useLoad } from "../../useLoad";

/** Platform dashboard snapshot (tenants, GMV, alerts). */
export function usePlatformDashboard() {
  return useLoad(() => fetchPlatformDashboard(), []);
}
