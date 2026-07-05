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

type InventoryRow = {
  productId: string;
  name: string;
  sku: string;
  mode: string;
  available: number;
  reserved: number;
  lowStockThreshold: number;
  stockStatus: string;
};

export function InventoryPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [managing, setManaging] = useState<InventoryRow | null>(null);
  const { data, error, loading } = useLoad(() => fetchPlatformInventory(100), [reloadKey]);
  const canWrite = canAccessArea(getStoredUser()?.role, "inventory", "write");

  const columns: {
    key: string;
    label: string;
    render?: (row: Record<string, unknown>) => ReactNode;
  }[] = [
    { key: "name", label: "Product" },
    { key: "sku", label: "SKU" },
    {
      key: "available",
      label: "Available",
      render: (r: Record<string, unknown>) =>
        r.mode === "made_to_order" ? "—" : String(r.available),
    },
    {
      key: "reserved",
      label: "Reserved",
      render: (r: Record<string, unknown>) =>
        r.mode === "made_to_order" ? "—" : String(r.reserved),
    },
    { key: "lowStockThreshold", label: "Threshold" },
    {
      key: "stockStatus",
      label: "Status",
      render: (r: Record<string, unknown>) => <StatusTag status={String(r.stockStatus)} />,
    },
  ];
  if (canWrite) {
    columns.push({
      key: "manage",
      label: "",
      render: (r: Record<string, unknown>) => (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setManaging(r as unknown as InventoryRow)}
        >
          Manage
        </button>
      ),
    });
  }

  return (
    <>
      <PlatformPageHeader
        title="Inventory"
        subtitle="Stock levels and low-stock alerts. Made-to-order products aren't stocked, so they don't show an availability count."
      />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <DataTable
          empty="No inventory rows."
          rows={data.items as unknown as Record<string, unknown>[]}
          columns={columns}
        />
      )}
      {managing && (
        <InventoryManageModal
          row={managing}
          onClose={() => setManaging(null)}
          onChanged={() => setReloadKey((k) => k + 1)}
        />
      )}
    </>
  );
}

function InventoryManageModal({
  row,
  onClose,
  onChanged,
}: {
  row: InventoryRow;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [mode, setMode] = useState<"physical" | "made_to_order">(
    row.mode === "made_to_order" ? "made_to_order" : "physical",
  );
  const [threshold, setThreshold] = useState(row.lowStockThreshold);
  const [txnType, setTxnType] = useState<InventoryTxnType>("add");
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  async function saveMode() {
    setBusy(true);
    setErr("");
    setNote("");
    try {
      await setInventoryMode(row.productId, { mode, lowStockThreshold: threshold });
      setNote("Mode & threshold saved.");
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update mode");
    } finally {
      setBusy(false);
    }
  }

  async function applyStock() {
    if (qty === 0) {
      setErr("Enter a quantity.");
      return;
    }
    if (!reason.trim()) {
      setErr("Add a reason for the change.");
      return;
    }
    setBusy(true);
    setErr("");
    setNote("");
    try {
      await adjustInventory(row.productId, {
        type: txnType,
        qty: Math.abs(qty),
        reason: reason.trim(),
      });
      setNote("Stock updated.");
      setQty(0);
      setReason("");
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update stock");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.4)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
        padding: 20,
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: 24, maxWidth: 460, width: "100%" }}
      >
        <div
          className="row"
          style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}
        >
          <h3 style={{ fontSize: 18 }}>{row.name}</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="muted" style={{ fontSize: 12, marginBottom: 16 }}>
          {row.sku}
        </p>

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
          <label className="lbl">Fulfilment mode</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className={mode === "physical" ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"}
              onClick={() => setMode("physical")}
            >
              Physical (track stock)
            </button>
            <button
              type="button"
              className={mode === "made_to_order" ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"}
              onClick={() => setMode("made_to_order")}
            >
              Made to order
            </button>
          </div>
        </div>
        {mode === "physical" && (
          <div className="field">
            <label className="lbl">Low-stock threshold</label>
            <input
              className="inp"
              type="number"
              min={0}
              value={threshold}
              onChange={(e) => setThreshold(Math.max(0, Number(e.target.value)))}
            />
          </div>
        )}
        <button type="button" className="btn btn-soft btn-sm" disabled={busy} onClick={saveMode}>
          Save mode & threshold
        </button>

        {mode === "physical" ? (
          <>
            <div className="divider" style={{ margin: "18px 0" }} />
            <label className="lbl">Adjust stock</label>
            <div className="row" style={{ gap: 8, marginBottom: 8 }}>
              {(["add", "reduce", "adjust"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={txnType === t ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"}
                  onClick={() => setTxnType(t)}
                >
                  {t === "add" ? "Restock" : t === "reduce" ? "Remove" : "Correct"}
                </button>
              ))}
            </div>
            <div className="row" style={{ gap: 8 }}>
              <input
                className="inp"
                type="number"
                placeholder="Qty"
                value={qty || ""}
                onChange={(e) => setQty(Number(e.target.value))}
                style={{ width: 100 }}
              />
              <input
                className="inp"
                placeholder="Reason (e.g. PO #1234)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-brand btn-sm"
              style={{ marginTop: 10 }}
              disabled={busy}
              onClick={applyStock}
            >
              Apply stock change
            </button>
          </>
        ) : (
          <p className="muted" style={{ fontSize: 12, marginTop: 14 }}>
            Made-to-order products are produced per order and don't track stock.
          </p>
        )}
      </div>
    </div>
  );
}
