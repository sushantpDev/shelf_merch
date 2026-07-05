import { fetchPlatformOrder, fetchPlatformOrders } from "@/services/platform-api";
import { useLoad } from "../../useLoad";

// Order action fns + types re-exported so controllers/views never reach into services/ directly.
export {
  addOrderNote,
  assignOrderVendor,
  createOrderReplacement,
  fetchPlatformVendors,
  ORDER_STATUSES,
  setOrderStatus,
  uploadOrderMockup,
  type OrderItemProduct,
  type PrintArea,
  type ProductVariant,
} from "@/services/platform-api";

/** Cross-tenant order list. */
export function usePlatformOrders() {
  return useLoad(() => fetchPlatformOrders({ limit: 100 }), []);
}

/** Single platform order; bump `reloadKey` to refetch after a mutation. */
export function usePlatformOrder(orderId: string, reloadKey: number) {
  return useLoad(() => fetchPlatformOrder(orderId), [orderId, reloadKey]);
}
