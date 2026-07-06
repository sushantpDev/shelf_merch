import { fetchPlatformShipments } from "@/services/platform-api";
import { useLoad } from "../../useLoad";

export {
  addShipmentEvent,
  createShipment,
  resendShipmentTracking,
  SHIPMENT_STATUSES,
  updateShipment,
} from "@/services/platform-api";

/** Platform shipment list; bump `reloadKey` to refetch after a mutation. */
export function usePlatformShipments(reloadKey: number) {
  return useLoad(() => fetchPlatformShipments(100), [reloadKey]);
}
