import { getStoredUser } from "@/services/auth-store";
import { canAccessArea } from "@/services/platform-access";
import { usePlatformProducts } from "../model";

export type CatalogVm = ReturnType<typeof usePlatformProducts> & {
  canWrite: boolean;
};

/** Controller for the platform catalog list. */
export function useCatalogController(): CatalogVm {
  const load = usePlatformProducts();
  const canWrite = canAccessArea(getStoredUser()?.role, "catalog", "write");

  return { ...load, canWrite };
}
