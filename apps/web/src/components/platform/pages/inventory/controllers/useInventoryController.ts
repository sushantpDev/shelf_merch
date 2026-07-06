import { useState } from "react";
import { getStoredUser } from "@/services/auth-store";
import { canAccessArea } from "@/services/platform-access";
import { type InventoryRow, usePlatformInventory } from "../model";

export type InventoryVm = ReturnType<typeof usePlatformInventory> & {
  canWrite: boolean;
  managing: InventoryRow | null;
  onManage: (row: InventoryRow) => void;
  onCloseManage: () => void;
  onInventoryChanged: () => void;
};

/** Controller for the platform inventory list. */
export function useInventoryController(): InventoryVm {
  const [reloadKey, setReloadKey] = useState(0);
  const [managing, setManaging] = useState<InventoryRow | null>(null);
  const load = usePlatformInventory(reloadKey);
  const canWrite = canAccessArea(getStoredUser()?.role, "inventory", "write");

  return {
    ...load,
    canWrite,
    managing,
    onManage: setManaging,
    onCloseManage: () => setManaging(null),
    onInventoryChanged: () => setReloadKey((k) => k + 1),
  };
}
