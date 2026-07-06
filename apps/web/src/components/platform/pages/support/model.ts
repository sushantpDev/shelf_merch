import { fetchPlatformSupport } from "@/services/platform-api";
import { useLoad } from "../../useLoad";

export {
  addTicketMessage,
  assignTicket,
  fetchPlatformTeam,
  resendRedemptionLink,
  resendTicketTracking,
  setTicketStatus,
  SUPPORT_TICKET_STATUSES,
} from "@/services/platform-api";

/** Platform support ticket queue; bump `reloadKey` to refetch after a mutation. */
export function usePlatformSupport(reloadKey: number) {
  return useLoad(() => fetchPlatformSupport(100), [reloadKey]);
}
