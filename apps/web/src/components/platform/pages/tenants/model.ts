import {
  fetchPlatformTenants,
  type PlatformTenantRow,
  type TenantListParams,
} from "@/services/platform-api";
import { useLoad } from "../../useLoad";

export {
  setTenantStatus,
  TENANT_STATUSES,
  fetchPlatformTenant,
  fetchTenantOverview,
  fetchTenantUsers,
  updatePlatformTenant,
  setPrimaryAdmin,
  fetchPlatformOrders,
  fetchAuditLogs,
} from "@/services/platform-api";

export type TenantRow = PlatformTenantRow;

export const PAGE_SIZES = [20, 50, 100] as const;

export const STATUS_FILTERS = [
  { value: "", label: "Active & Suspended" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
] as const;

/** Title-case a status for display; unknown/legacy values render safely. */
export function formatTenantStatus(status: string) {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatRelativeTime(iso: string | null | undefined) {
  if (!iso) return "No activity";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Unavailable";
  const diffSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), "day");
  if (abs < 86400 * 365) return rtf.format(Math.round(diffSec / (86400 * 30)), "month");
  return rtf.format(Math.round(diffSec / (86400 * 365)), "year");
}

export function allowedNextStatuses(current: string): Array<"active" | "suspended" | "archived"> {
  switch (current) {
    case "trial":
      return ["active", "suspended", "archived"];
    case "active":
      return ["suspended", "archived"];
    case "suspended":
      return ["active", "archived"];
    case "archived":
      return ["active"];
    default:
      return ["active", "suspended", "archived"];
  }
}

export function usePlatformTenants(params: TenantListParams, reloadKey: number) {
  return useLoad(() => fetchPlatformTenants(params), [
    reloadKey,
    params.status ?? "",
    params.search ?? "",
    params.page ?? 1,
    params.limit ?? 20,
    params.sort ?? "createdAt",
    params.order ?? "desc",
  ]);
}
