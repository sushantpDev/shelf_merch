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

export function ProductionPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [managing, setManaging] = useState<Record<string, unknown> | null>(null);
  const board = useLoad(() => fetchProductionBoard(), [reloadKey]);
  const tasks = useLoad(() => fetchProductionTasks({ limit: 100 }), [reloadKey]);
  const canWrite = canAccessArea(getStoredUser()?.role, "production", "write");
  const data = board.data;

  const taskColumns: {
    key: string;
    label: string;
    render?: (row: Record<string, unknown>) => ReactNode;
  }[] = [
    { key: "_id", label: "Task", render: (r) => String(r._id).slice(-6) },
    { key: "orderId", label: "Order", render: (r) => String(r.orderId ?? "").slice(-6) },
    { key: "assignedTo", label: "Assignee", render: (r) => String(r.assignedTo || "—") },
    { key: "status", label: "Status", render: (r) => <StatusTag status={String(r.status)} /> },
    { key: "qcResult", label: "QC", render: (r) => String(r.qcResult || "—") },
  ];
  if (canWrite) {
    taskColumns.push({
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
      <PlatformPageHeader title="Production" subtitle="Task board and orders in production." />
      {board.loading && <PlatformLoading />}
      {board.error && <PlatformError message={board.error} />}
      {data && (
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="h1" style={{ fontSize: 16, marginBottom: 12 }}>
              Tasks by status
            </div>
            {Object.entries(data.taskBuckets).map(([status, bucket]) => (
              <div
                key={status}
                className="row"
                style={{ justifyContent: "space-between", marginBottom: 8 }}
              >
                <StatusTag status={status} />
                <span className="num">{bucket.count}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="h1" style={{ fontSize: 16, marginBottom: 12 }}>
              Orders in production
            </div>
            {Object.entries(data.orderBuckets).map(([status, bucket]) =>
              bucket.count > 0 ? (
                <div
                  key={status}
                  className="row"
                  style={{ justifyContent: "space-between", marginBottom: 8 }}
                >
                  <StatusTag status={status} />
                  <span className="num">{bucket.count}</span>
                </div>
              ) : null,
            )}
          </div>
        </div>
      )}

      <h3 style={{ margin: "24px 0 12px" }}>Production tasks</h3>
      {tasks.error && <PlatformError message={tasks.error} />}
      {tasks.data && (
        <DataTable empty="No production tasks." rows={tasks.data.items} columns={taskColumns} />
      )}
      {managing && (
        <TaskManageModal
          row={managing}
          onClose={() => setManaging(null)}
          onChanged={() => setReloadKey((k) => k + 1)}
        />
      )}
    </>
  );
}

function TaskManageModal({
  row,
  onClose,
  onChanged,
}: {
  row: Record<string, unknown>;
  onClose: () => void;
  onChanged: () => void;
}) {
  const id = String(row._id);
  const [status, setStatus] = useState(String(row.status ?? "created"));
  const [note, setNote] = useState("");
  const [qcPassed, setQcPassed] = useState(true);
  const [qcReason, setQcReason] = useState("");
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
      title={`Task ${id.slice(-6)}`}
      subtitle={`Order ${String(row.orderId ?? "").slice(-6)}`}
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

      <div className="field">
        <label className="lbl">Advance status</label>
        <select className="inp" value={status} onChange={(e) => setStatus(e.target.value)}>
          {PRODUCTION_TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <input
        className="inp"
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <button
        type="button"
        className="btn btn-soft btn-sm"
        style={{ marginTop: 10 }}
        disabled={busy || status === row.status}
        onClick={() => run(() => setTaskStatus(id, status, note || undefined), "Status updated.")}
      >
        Save status
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <label className="lbl">Quality check</label>
      <div className="row" style={{ gap: 8, marginBottom: 8 }}>
        <button
          type="button"
          className={qcPassed ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"}
          onClick={() => setQcPassed(true)}
        >
          Pass
        </button>
        <button
          type="button"
          className={!qcPassed ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"}
          onClick={() => setQcPassed(false)}
        >
          Fail
        </button>
      </div>
      {!qcPassed && (
        <input
          className="inp"
          placeholder="Failure reason"
          value={qcReason}
          onChange={(e) => setQcReason(e.target.value)}
        />
      )}
      <button
        type="button"
        className="btn btn-brand btn-sm"
        style={{ marginTop: 10 }}
        disabled={busy || (!qcPassed && !qcReason.trim())}
        onClick={() =>
          run(() => recordTaskQc(id, qcPassed, qcReason.trim() || undefined), "QC recorded.")
        }
      >
        Record QC
      </button>
    </PlatformModal>
  );
}
