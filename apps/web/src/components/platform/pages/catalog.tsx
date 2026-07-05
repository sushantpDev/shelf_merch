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

export function CatalogPage() {
  const { data, error, loading } = useLoad(() => fetchPlatformProducts({ limit: 100 }));
  const canWrite = canAccessArea(getStoredUser()?.role, "catalog", "write");

  return (
    <>
      <PlatformPageHeader
        title="Catalog"
        subtitle="Platform product master with internal cost and margin."
        actions={
          canWrite ? (
            <>
              <Link to="/platform/catalog/import" className="btn btn-ghost btn-sm">
                Import from Shopify
              </Link>
              <Link to="/platform/catalog/new" className="btn btn-brand btn-sm">
                + New product
              </Link>
            </>
          ) : null
        }
      />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <DataTable
          empty="No products yet."
          rows={data.items as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: "name",
              label: "Product",
              render: (r) => (
                <Link to={`/platform/catalog/${String(r._id)}`} className="lnk">
                  {String(r.name)}
                </Link>
              ),
            },
            { key: "sku", label: "SKU" },
            {
              key: "status",
              label: "Status",
              render: (r) => <StatusTag status={String(r.status)} />,
            },
            {
              key: "sellingPriceInr",
              label: "Sell",
              render: (r) => inr(Number(r.sellingPriceInr)),
            },
            {
              key: "costPriceInr",
              label: "Cost",
              render: (r) => inr(Number(r.costPriceInr)),
            },
            {
              key: "marginPct",
              label: "Margin",
              render: (r) => `${Number(r.marginPct)}%`,
            },
            {
              key: "stock",
              label: "Available",
              render: (r) => String((r.inventory as { available?: number })?.available ?? 0),
            },
          ]}
        />
      )}
    </>
  );
}
