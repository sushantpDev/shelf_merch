import { getStoredUser } from "@/services/api-bridge";
import { canAccessTenantArea, type TenantArea } from "@/services/tenant-access";
import { useWorkspace } from "@/hooks/useWorkspace";

export function useTenantAccess() {
  const { data: workspace } = useWorkspace();
  const sessionUser = getStoredUser();
  const role = workspace?.userPatch?.role ?? sessionUser?.role;
  const scopeType = sessionUser?.scopeType;
  const assignedEntityIds = sessionUser?.assignedEntityIds ?? [];

  return {
    role,
    scopeType,
    assignedEntityIds,
    isEntityManager: role === "entity_manager",
    isCompanyAdmin: role === "company_admin",
    canRead: (area: TenantArea) => canAccessTenantArea(role, area, "read"),
    canWrite: (area: TenantArea) => canAccessTenantArea(role, area, "write"),
    canOperateCampaigns: () => canAccessTenantArea(role, "campaignOps", "write"),
  };
}
