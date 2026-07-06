import { useState } from "react";
import { getStoredUser } from "@/services/auth-store";
import { canAccessArea } from "@/services/platform-access";
import { usePlatformSupport } from "../model";

export type SupportVm = ReturnType<typeof usePlatformSupport> & {
  canWrite: boolean;
  managing: Record<string, unknown> | null;
  onManage: (row: Record<string, unknown>) => void;
  onCloseManage: () => void;
  onReload: () => void;
};

/** Controller for the platform support page. */
export function useSupportController(): SupportVm {
  const [reloadKey, setReloadKey] = useState(0);
  const [managing, setManaging] = useState<Record<string, unknown> | null>(null);
  const load = usePlatformSupport(reloadKey);
  const canWrite = canAccessArea(getStoredUser()?.role, "support", "write");

  return {
    ...load,
    canWrite,
    managing,
    onManage: setManaging,
    onCloseManage: () => setManaging(null),
    onReload: () => setReloadKey((k) => k + 1),
  };
}
