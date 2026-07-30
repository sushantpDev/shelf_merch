import type { ZohoConnectionStatus } from "@/services/zoho-api";

export function zohoPeopleConnectionSubtitle(status: ZohoConnectionStatus): string {
  switch (status) {
    case "connected":
      return "Zoho People is connected. Sync employees to keep ShelfMerch contacts up to date.";
    case "needs_attention":
    case "expired":
    case "error":
      return "Reconnect Zoho People to restore employee syncing.";
    default:
      return "Connect Zoho People to import employees into ShelfMerch.";
  }
}

export function zohoPeopleStatusLabel(status: ZohoConnectionStatus): string {
  switch (status) {
    case "connected":
      return "Connected";
    case "needs_attention":
    case "expired":
    case "error":
      return "Needs attention";
    default:
      return "Not connected";
  }
}

export function zohoPeopleStatusClass(status: ZohoConnectionStatus): string {
  switch (status) {
    case "connected":
      return "zoho-status zoho-status--connected";
    case "needs_attention":
    case "expired":
    case "error":
      return "zoho-status zoho-status--expired";
    default:
      return "zoho-status zoho-status--idle";
  }
}

export function isZohoPeopleIntegrationActive(
  status: ZohoConnectionStatus,
  integration: unknown,
): boolean {
  return status !== "not_connected" && integration != null;
}
