import { fetchProductionBoard, fetchProductionTasks } from "@/services/platform-api";
import { useLoad } from "../../useLoad";

export {
  PRODUCTION_TASK_STATUSES,
  recordTaskQc,
  setTaskStatus,
} from "@/services/platform-api";

/** Production board snapshot (task and order buckets). */
export function useProductionBoard(reloadKey: number) {
  return useLoad(() => fetchProductionBoard(), [reloadKey]);
}

/** Production task list; bump `reloadKey` to refetch after a mutation. */
export function useProductionTasks(reloadKey: number) {
  return useLoad(() => fetchProductionTasks({ limit: 100 }), [reloadKey]);
}
