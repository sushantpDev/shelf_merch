import { usePlatformKits } from "../model";
import type { PlatformKitTemplate } from "../model";
import { useTenantAccess } from "@/hooks/useTenantAccess";

export type PreDesignedKitsVm = {
  isLoading: boolean;
  kits: PlatformKitTemplate[] | undefined;
  canCreateKits: boolean;
};

/** Controller for the pre-designed kits widget: platform kit templates query. */
export function usePreDesignedKitsController(): PreDesignedKitsVm {
  const { data: kits, isLoading } = usePlatformKits();
  const { canCreateKits } = useTenantAccess();
  return { isLoading, kits, canCreateKits: canCreateKits() };
}
