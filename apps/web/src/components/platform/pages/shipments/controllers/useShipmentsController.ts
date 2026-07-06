import { useState } from "react";
import { getStoredUser } from "@/services/auth-store";
import { canAccessArea } from "@/services/platform-access";
import { usePlatformShipments } from "../model";

export type ShipmentsVm = ReturnType<typeof usePlatformShipments> & {
  canWrite: boolean;
  managing: Record<string, unknown> | null;
  creating: boolean;
  onManage: (row: Record<string, unknown>) => void;
  onCloseManage: () => void;
  onOpenCreate: () => void;
  onCloseCreate: () => void;
  onReload: () => void;
  onCreateDone: () => void;
};

/** Controller for the platform shipments page. */
export function useShipmentsController(): ShipmentsVm {
  const [reloadKey, setReloadKey] = useState(0);
  const [managing, setManaging] = useState<Record<string, unknown> | null>(null);
  const [creating, setCreating] = useState(false);
  const load = usePlatformShipments(reloadKey);
  const canWrite = canAccessArea(getStoredUser()?.role, "shipments", "write");

  const reload = () => setReloadKey((k) => k + 1);

  return {
    ...load,
    canWrite,
    managing,
    creating,
    onManage: setManaging,
    onCloseManage: () => setManaging(null),
    onOpenCreate: () => setCreating(true),
    onCloseCreate: () => setCreating(false),
    onReload: reload,
    onCreateDone: () => {
      setCreating(false);
      reload();
    },
  };
}
