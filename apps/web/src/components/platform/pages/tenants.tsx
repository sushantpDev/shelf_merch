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

type TenantRow = { _id: string; name: string; slug: string; status: string; plan?: string };

export function TenantsPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [managing, setManaging] = useState<TenantRow | null>(null);
  const { data, error, loading } = useLoad(() => fetchPlatformTenants(), [reloadKey]);
  const canWrite = canAccessArea(getStoredUser()?.role, "tenants", "write");

  const columns: {
    key: string;
    label: string;
    render?: (row: Record<string, unknown>) => ReactNode;
  }[] = [
    { key: "name", label: "Tenant" },
    { key: "slug", label: "Slug" },
    { key: "status", label: "Status", render: (r) => <StatusTag status={String(r.status)} /> },
    { key: "plan", label: "Plan", render: (r) => String(r.plan ?? "—") },
    { key: "walletBalanceInr", label: "Wallet", render: (r) => inr(Number(r.walletBalanceInr)) },
    { key: "openOrders", label: "Open orders" },
    { key: "outstandingInr", label: "Outstanding", render: (r) => inr(Number(r.outstandingInr)) },
  ];
  if (canWrite) {
    columns.push({
      key: "manage",
      label: "",
      render: (r) => (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setManaging(r as unknown as TenantRow)}
        >
          Manage
        </button>
      ),
    });
  }

  return (
    <>
      <PlatformPageHeader title="Tenants" subtitle="All workspaces on the platform." />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <DataTable
          empty="No tenants yet."
          rows={data as unknown as Record<string, unknown>[]}
          columns={columns}
        />
      )}
      {managing && (
        <TenantManageModal
          row={managing}
          onClose={() => setManaging(null)}
          onChanged={() => setReloadKey((k) => k + 1)}
        />
      )}
    </>
  );
}

function TenantManageModal({
  row,
  onClose,
  onChanged,
}: {
  row: TenantRow;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [status, setStatus] = useState(row.status);
  const [reason, setReason] = useState("");
  const [plan, setPlan] = useState(row.plan ?? "trial");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setErr("");
    setNote("");
    try {
      await fn();
      setNote(ok);
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PlatformModal title={row.name} subtitle={`@${row.slug}`} onClose={onClose}>
      {err && <PlatformError message={err} />}
      {note && (
        <div
          className="card"
          style={{ padding: 10, marginBottom: 12, color: "var(--brand)", fontSize: 13 }}
        >
          {note}
        </div>
      )}

      <div className="field">
        <label className="lbl">Account status</label>
        <select className="inp" value={status} onChange={(e) => setStatus(e.target.value)}>
          {TENANT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <input
        className="inp"
        placeholder="Reason (optional, for the audit log)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <button
        type="button"
        className="btn btn-soft btn-sm"
        style={{ marginTop: 10 }}
        disabled={busy || status === row.status}
        onClick={() =>
          run(() => setTenantStatus(row._id, status, reason || undefined), "Status updated.")
        }
      >
        Save status
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />

      <div className="field">
        <label className="lbl">Plan</label>
        <select className="inp" value={plan} onChange={(e) => setPlan(e.target.value)}>
          {TENANT_PLANS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="btn btn-soft btn-sm"
        disabled={busy || plan === row.plan}
        onClick={() => run(() => setTenantPlan(row._id, plan), "Plan updated.")}
      >
        Save plan
      </button>
    </PlatformModal>
  );
}
