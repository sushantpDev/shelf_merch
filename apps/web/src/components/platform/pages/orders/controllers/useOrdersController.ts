import { usePlatformOrders } from "../model";

export type OrdersVm = ReturnType<typeof usePlatformOrders>;

/** Controller for the platform orders list. */
export function useOrdersController(): OrdersVm {
  return usePlatformOrders();
}
