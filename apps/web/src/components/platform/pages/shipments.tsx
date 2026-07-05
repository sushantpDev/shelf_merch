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

export function ShipmentsPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [managing, setManaging] = useState<Record<string, unknown> | null>(null);
  const [creating, setCreating] = useState(false);
  const { data, error, loading } = useLoad(() => fetchPlatformShipments(100), [reloadKey]);
  const canWrite = canAccessArea(getStoredUser()?.role, "shipments", "write");
  const reload = () => setReloadKey((k) => k + 1);

  const columns: {
    key: string;
    label: string;
    render?: (row: Record<string, unknown>) => ReactNode;
  }[] = [
    { key: "awb", label: "AWB", render: (r) => String(r.awb ?? r.trackingNumber ?? "—") },
    { key: "courier", label: "Courier" },
    { key: "orderNumber", label: "Order", render: (r) => String(r.orderNumber ?? "—") },
    { key: "status", label: "Status", render: (r) => <StatusTag status={String(r.status)} /> },
    {
      key: "createdAt",
      label: "Created",
      render: (r) => new Date(String(r.createdAt)).toLocaleDateString("en-IN"),
    },
  ];
  if (canWrite) {
    columns.push({
      key: "manage",
      label: "",
      render: (r) => (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setManaging(r)}>
          Manage
        </button>
      ),
    });
  }

  return (
    <>
      <PlatformPageHeader
        title="Shipments"
        subtitle="AWB tracking and delivery exceptions."
        actions={
          canWrite ? (
            <button
              type="button"
              className="btn btn-brand btn-sm"
              onClick={() => setCreating(true)}
            >
              + New shipment
            </button>
          ) : null
        }
      />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && <DataTable empty="No shipments yet." rows={data.items} columns={columns} />}
      {managing && (
        <ShipmentManageModal row={managing} onClose={() => setManaging(null)} onChanged={reload} />
      )}
      {creating && (
        <ShipmentCreateModal
          onClose={() => setCreating(false)}
          onDone={() => {
            setCreating(false);
            reload();
          }}
        />
      )}
    </>
  );
}

function ShipmentCreateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [orderId, setOrderId] = useState("");
  const [courier, setCourier] = useState("");
  const [awb, setAwb] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!orderId.trim() || !courier.trim() || !awb.trim()) {
      setErr("Order ID, courier and AWB are required.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await createShipment({
        orderId: orderId.trim(),
        courier: courier.trim(),
        awb: awb.trim(),
        trackingUrl: trackingUrl.trim() || undefined,
      });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create shipment");
      setBusy(false);
    }
  }

  return (
    <PlatformModal title="New shipment" onClose={onClose}>
      {err && <PlatformError message={err} />}
      <div className="field">
        <label className="lbl">Order ID</label>
        <input className="inp" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
      </div>
      <div className="field">
        <label className="lbl">Courier</label>
        <input className="inp" value={courier} onChange={(e) => setCourier(e.target.value)} />
      </div>
      <div className="field">
        <label className="lbl">AWB</label>
        <input className="inp" value={awb} onChange={(e) => setAwb(e.target.value)} />
      </div>
      <div className="field">
        <label className="lbl">Tracking URL (optional)</label>
        <input
          className="inp"
          value={trackingUrl}
          onChange={(e) => setTrackingUrl(e.target.value)}
        />
      </div>
      <button type="button" className="btn btn-brand btn-block" disabled={busy} onClick={submit}>
        {busy ? "Creating…" : "Create shipment"}
      </button>
    </PlatformModal>
  );
}

function ShipmentManageModal({
  row,
  onClose,
  onChanged,
}: {
  row: Record<string, unknown>;
  onClose: () => void;
  onChanged: () => void;
}) {
  const id = String(row._id);
  const [evStatus, setEvStatus] = useState(String(row.status ?? "pending"));
  const [location, setLocation] = useState("");
  const [evNote, setEvNote] = useState("");
  const [courier, setCourier] = useState(String(row.courier ?? ""));
  const [awb, setAwb] = useState(String(row.awb ?? ""));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [okNote, setOkNote] = useState("");

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setErr("");
    setOkNote("");
    try {
      await fn();
      setOkNote(ok);
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PlatformModal
      title={`Shipment ${row.awb ?? ""}`}
      subtitle={String(row.courier ?? "")}
      onClose={onClose}
    >
      {err && <PlatformError message={err} />}
      {okNote && (
        <div
          className="card"
          style={{ padding: 10, marginBottom: 12, color: "var(--brand)", fontSize: 13 }}
        >
          {okNote}
        </div>
      )}

      <label className="lbl">Add tracking event</label>
      <div className="field">
        <select className="inp" value={evStatus} onChange={(e) => setEvStatus(e.target.value)}>
          {SHIPMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <input
          className="inp"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <input
          className="inp"
          placeholder="Note"
          value={evNote}
          onChange={(e) => setEvNote(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="btn btn-soft btn-sm"
        style={{ marginTop: 10 }}
        disabled={busy}
        onClick={() =>
          run(
            () =>
              addShipmentEvent(id, {
                status: evStatus,
                location: location || undefined,
                note: evNote || undefined,
              }),
            "Event added.",
          )
        }
      >
        Add event
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <label className="lbl">Edit courier / AWB</label>
      <div className="row" style={{ gap: 8 }}>
        <input
          className="inp"
          placeholder="Courier"
          value={courier}
          onChange={(e) => setCourier(e.target.value)}
        />
        <input
          className="inp"
          placeholder="AWB"
          value={awb}
          onChange={(e) => setAwb(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="btn btn-soft btn-sm"
        style={{ marginTop: 10 }}
        disabled={
          busy || (courier === row.courier && awb === row.awb) || !courier.trim() || !awb.trim()
        }
        onClick={() =>
          run(
            () => updateShipment(id, { courier: courier.trim(), awb: awb.trim() }),
            "Shipment updated.",
          )
        }
      >
        Save changes
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={busy}
        onClick={() => run(() => resendShipmentTracking(id), "Tracking email resent.")}
      >
        Resend tracking email
      </button>
    </PlatformModal>
  );
}
