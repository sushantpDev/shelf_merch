import { useAuditLogs } from "../model";

export type AuditVm = ReturnType<typeof useAuditLogs>;

/** Controller for the platform audit logs page. */
export function useAuditController(): AuditVm {
  return useAuditLogs();
}
