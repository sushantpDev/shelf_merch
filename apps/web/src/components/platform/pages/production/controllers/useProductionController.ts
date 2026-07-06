import { useState } from "react";
import { getStoredUser } from "@/services/auth-store";
import { canAccessArea } from "@/services/platform-access";
import { useProductionBoard, useProductionTasks } from "../model";

export type ProductionVm = {
  board: ReturnType<typeof useProductionBoard>;
  tasks: ReturnType<typeof useProductionTasks>;
  canWrite: boolean;
  managing: Record<string, unknown> | null;
  onManage: (row: Record<string, unknown>) => void;
  onCloseManage: () => void;
  onProductionChanged: () => void;
};

/** Controller for the platform production page. */
export function useProductionController(): ProductionVm {
  const [reloadKey, setReloadKey] = useState(0);
  const [managing, setManaging] = useState<Record<string, unknown> | null>(null);
  const board = useProductionBoard(reloadKey);
  const tasks = useProductionTasks(reloadKey);
  const canWrite = canAccessArea(getStoredUser()?.role, "production", "write");

  return {
    board,
    tasks,
    canWrite,
    managing,
    onManage: setManaging,
    onCloseManage: () => setManaging(null),
    onProductionChanged: () => setReloadKey((k) => k + 1),
  };
}
