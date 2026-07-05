import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { getStoredUser } from "@/services/auth-store";
import { canAccessArea } from "@/services/platform-access";
import {
  addOrderNote,
  addShipmentEvent,
  addTicketMessage,
  adjustInventory,
  approveFunding,
  assignOrderVendor,
  assignTicket,
  changeTeamRole,
  createOrderReplacement,
  createShipment,
  deactivateTeamMember,
  fetchAuditLogs,
  fetchFinanceOutstanding,
  fetchFundingApprovals,
  fetchPlatformDashboard,
  fetchPlatformInventory,
  fetchPlatformKits,
  fetchPlatformOrders,
  fetchPlatformOrder,
  fetchPlatformProducts,
  fetchPlatformSettings,
  fetchPlatformShipments,
  fetchPlatformSupport,
  fetchPlatformTeam,
  fetchPlatformTenants,
  fetchPlatformVendors,
  fetchProductionBoard,
  fetchProductionTasks,
  inviteTeamMember,
  ORDER_STATUSES,
  PLATFORM_ROLES,
  PRODUCTION_TASK_STATUSES,
  reactivateTeamMember,
  recordTaskQc,
  rejectFunding,
  resendRedemptionLink,
  resendShipmentTracking,
  resendTicketTracking,
  setInventoryMode,
  setOrderStatus,
  setTaskStatus,
  setTenantPlan,
  setTenantStatus,
  setTicketStatus,
  SHIPMENT_STATUSES,
  SUPPORT_TICKET_STATUSES,
  TENANT_PLANS,
  TENANT_STATUSES,
  updateShipment,
  updateSetting,
  uploadOrderMockup,
  type InventoryTxnType,
  type OrderItemProduct,
  type PrintArea,
  type ProductVariant,
} from "@/services/platform-api";
import { resolveColorHex } from "@/lib/colorMap";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { TintedGarment } from "@/components/store/TintedGarment";
import {
  DataTable,
  inr,
  MetricGrid,
  PlatformError,
  PlatformLoading,
  PlatformModal,
  PlatformPageHeader,
  StatusTag,
} from "../platform-ui";
import { useLoad } from "../useLoad";

export function DashboardPage() {
  const { data, error, loading } = useLoad(() => fetchPlatformDashboard());

  return (
    <>
      <PlatformPageHeader
        title="Dashboard"
        subtitle="Morning glance across tenants, orders, inventory, and finance."
      />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <>
          <MetricGrid
            items={[
              ["Active tenants", data.cards.activeTenants],
              ["Total GMV", inr(data.cards.totalGmvInr)],
              ["Orders in progress", data.cards.ordersInProgress],
              ["Delayed orders", data.cards.delayedOrders],
              ["Open tickets", data.cards.openSupportTickets],
              ["Low stock items", data.cards.lowStockItems],
              ["Outstanding", inr(data.cards.outstandingPaymentsInr)],
            ]}
          />
          {Array.isArray((data.sections as { criticalAlerts?: unknown[] }).criticalAlerts) &&
          (data.sections as { criticalAlerts: unknown[] }).criticalAlerts.length > 0 ? (
            <div className="card" style={{ marginTop: 24, padding: 16 }}>
              <div className="h1" style={{ fontSize: 16, marginBottom: 12 }}>
                Critical alerts
              </div>
              <ul style={{ paddingLeft: 18, color: "var(--ink-2)" }}>
                {(
                  data.sections as {
                    criticalAlerts: Array<{ kind: string; count?: number; amountInr?: number }>;
                  }
                ).criticalAlerts.map((a) => (
                  <li key={a.kind} style={{ marginBottom: 6 }}>
                    {a.kind.replace(/_/g, " ")}
                    {a.count != null ? ` (${a.count})` : ""}
                    {a.amountInr != null ? ` — ${inr(a.amountInr)}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
