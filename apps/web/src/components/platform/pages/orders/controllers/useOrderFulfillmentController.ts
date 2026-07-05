import { useState } from "react";
import { getStoredUser } from "@/services/auth-store";
import { canAccessArea } from "@/services/platform-access";
import { usePlatformOrder } from "../model";

export type OrderFulfillmentVm = {
  data: Record<string, unknown> | null;
  error: string;
  loading: boolean;
  canWrite: boolean;
  reload: () => void;
};

/** Controller for the platform order fulfilment page: load + reload + access. */
export function useOrderFulfillmentController(orderId: string): OrderFulfillmentVm {
  const [reloadKey, setReloadKey] = useState(0);
  const { data, error, loading } = usePlatformOrder(orderId, reloadKey);
  const canWrite = canAccessArea(getStoredUser()?.role, "orders", "write");

  return {
    data: data as Record<string, unknown> | null,
    error,
    loading,
    canWrite,
    reload: () => setReloadKey((k) => k + 1),
  };
}
