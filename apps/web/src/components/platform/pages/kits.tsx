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

export function KitsPage() {
  const { data, error, loading } = useLoad(() => fetchPlatformKits());

  const canWrite = canAccessArea(getStoredUser()?.role, "kits", "write");

  return (
    <>
      <PlatformPageHeader
        title="Kits"
        subtitle="Platform-curated gift bundles."
        actions={
          canWrite ? (
            <div className="row" style={{ gap: 8 }}>
              <Link to="/platform/kits/import" className="btn btn-soft btn-sm">
                Import from Shopify
              </Link>
              <Link to="/platform/kits/new" className="btn btn-brand btn-sm">
                + Create a kit
              </Link>
            </div>
          ) : null
        }
      />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <DataTable
          empty="No kits yet."
          rows={data as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: "name",
              label: "Kit",
              render: (r) => (
                <Link to={`/platform/kits/${String(r._id)}`} className="lnk">
                  {String(r.name)}
                </Link>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (r) => <StatusTag status={String(r.status)} />,
            },
            {
              key: "approxValueInr",
              label: "Approx value",
              render: (r) => inr(Number(r.approxValueInr)),
            },
            {
              key: "items",
              label: "Items",
              render: (r) => String(Array.isArray(r.items) ? r.items.length : 0),
            },
          ]}
        />
      )}
    </>
  );
}
