import { fetchPlatformSupport } from "@/services/platform-api";
import { useLoad } from "../../useLoad";

export {
  addTicketMessage,
  assignTicket,
  fetchPlatformTeam,
  fetchPlatformTicket,
  resendRedemptionLink,
  resendTicketTracking,
  setTicketStatus,
  SUPPORT_TICKET_STATUSES,
} from "@/services/platform-api";

export type SupportQueueFilter = "all" | "mine" | "unassigned";

/** Platform support ticket queue; bump `reloadKey` to refetch after a mutation. */
export function usePlatformSupport(reloadKey: number, filter: SupportQueueFilter, myUserId: string) {
  return useLoad(
    () =>
      fetchPlatformSupport(
        100,
        filter === "mine"
          ? { assignedToUserId: myUserId }
          : filter === "unassigned"
            ? { unassigned: true }
            : undefined,
      ),
    [reloadKey, filter, myUserId],
  );
}
