import { getStoredUser } from "@/services/auth-store";
import { canAccessArea } from "@/services/platform-access";
import { usePlatformKitsList } from "../model";

export type KitsVm = ReturnType<typeof usePlatformKitsList> & {
  canWrite: boolean;
};

/** Controller for the platform kits list. */
export function useKitsController(): KitsVm {
  const load = usePlatformKitsList();
  const canWrite = canAccessArea(getStoredUser()?.role, "kits", "write");
  return { ...load, canWrite };
}
