import { fetchPlatformInventory } from "@/services/platform-api";
import { useLoad } from "../../useLoad";

export {
  adjustInventory,
  setInventoryMode,
  type InventoryTxnType,
} from "@/services/platform-api";

export type InventoryRow = {
  productId: string;
  name: string;
  sku: string;
  mode: string;
  available: number;
  reserved: number;
  lowStockThreshold: number;
  stockStatus: string;
};

/** Platform inventory list; bump `reloadKey` to refetch after a mutation. */
export function usePlatformInventory(reloadKey: number) {
  return useLoad(() => fetchPlatformInventory(100), [reloadKey]);
}
