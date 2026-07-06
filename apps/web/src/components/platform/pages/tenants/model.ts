import { fetchPlatformTenants } from "@/services/platform-api";
import { useLoad } from "../../useLoad";

export {
  setTenantPlan,
  setTenantStatus,
  TENANT_PLANS,
  TENANT_STATUSES,
} from "@/services/platform-api";

export type TenantRow = { _id: string; name: string; slug: string; status: string; plan?: string };

/** Platform tenant list; bump `reloadKey` to refetch after a mutation. */
export function usePlatformTenants(reloadKey: number) {
  return useLoad(() => fetchPlatformTenants(), [reloadKey]);
}
