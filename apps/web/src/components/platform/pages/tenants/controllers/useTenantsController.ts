import { useState } from "react";
import { getStoredUser } from "@/services/auth-store";
import { canAccessArea } from "@/services/platform-access";
import { type TenantRow, usePlatformTenants } from "../model";

export type TenantsVm = ReturnType<typeof usePlatformTenants> & {
  canWrite: boolean;
  managing: TenantRow | null;
  onManage: (row: TenantRow) => void;
  onCloseManage: () => void;
  onTenantsChanged: () => void;
};

/** Controller for the platform tenants list. */
export function useTenantsController(): TenantsVm {
  const [reloadKey, setReloadKey] = useState(0);
  const [managing, setManaging] = useState<TenantRow | null>(null);
  const load = usePlatformTenants(reloadKey);
  const canWrite = canAccessArea(getStoredUser()?.role, "tenants", "write");

  return {
    ...load,
    canWrite,
    managing,
    onManage: setManaging,
    onCloseManage: () => setManaging(null),
    onTenantsChanged: () => setReloadKey((k) => k + 1),
  };
}
