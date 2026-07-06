import { fetchAuditLogs } from "@/services/platform-api";
import { useLoad } from "../../useLoad";

/** Immutable platform audit trail. */
export function useAuditLogs() {
  return useLoad(() => fetchAuditLogs(100), []);
}
