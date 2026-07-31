import { useState } from "react";
import { getStoredUser } from "@/services/auth-store";
import { canAccessArea } from "@/services/platform-access";
import { usePlatformSupport, type SupportQueueFilter } from "../model";

export type SupportVm = ReturnType<typeof usePlatformSupport> & {
  canWrite: boolean;
  myUserId: string;
  filter: SupportQueueFilter;
  onFilter: (filter: SupportQueueFilter) => void;
  managing: Record<string, unknown> | null;
  onManage: (row: Record<string, unknown>) => void;
  onCloseManage: () => void;
  onReload: () => void;
};

/** Controller for the platform support page. */
export function useSupportController(): SupportVm {
  const me = getStoredUser();
  const myUserId = me?.id ?? "";
  const canWrite = canAccessArea(me?.role, "support", "write");
  // Department handlers only see their assigned tickets — lock filter to "mine".
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<SupportQueueFilter>(canWrite ? "all" : "mine");
  const [managing, setManaging] = useState<Record<string, unknown> | null>(null);
  const effectiveFilter: SupportQueueFilter = canWrite ? filter : "mine";
  const load = usePlatformSupport(reloadKey, effectiveFilter, myUserId);

  return {
    ...load,
    canWrite,
    myUserId,
    filter: effectiveFilter,
    onFilter: setFilter,
    managing,
    onManage: setManaging,
    onCloseManage: () => setManaging(null),
    onReload: () => setReloadKey((k) => k + 1),
  };
}
