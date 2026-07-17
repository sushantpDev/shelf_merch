import { useState } from "react";
import { getStoredUser } from "@/services/auth-store";
import { canAccessArea } from "@/services/platform-access";
import { usePlatformSupport, type SupportQueueFilter } from "../model";

export type SupportVm = ReturnType<typeof usePlatformSupport> & {
  canWrite: boolean;
  filter: SupportQueueFilter;
  onFilter: (filter: SupportQueueFilter) => void;
  managing: Record<string, unknown> | null;
  onManage: (row: Record<string, unknown>) => void;
  onCloseManage: () => void;
  onReload: () => void;
};

/** Controller for the platform support page. */
export function useSupportController(): SupportVm {
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<SupportQueueFilter>("all");
  const [managing, setManaging] = useState<Record<string, unknown> | null>(null);
  const me = getStoredUser();
  const load = usePlatformSupport(reloadKey, filter, me?.id ?? "");
  const canWrite = canAccessArea(me?.role, "support", "write");

  return {
    ...load,
    canWrite,
    filter,
    onFilter: setFilter,
    managing,
    onManage: setManaging,
    onCloseManage: () => setManaging(null),
    onReload: () => setReloadKey((k) => k + 1),
  };
}
