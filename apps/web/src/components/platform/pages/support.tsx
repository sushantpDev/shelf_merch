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

export function SupportPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [managing, setManaging] = useState<Record<string, unknown> | null>(null);
  const { data, error, loading } = useLoad(() => fetchPlatformSupport(100), [reloadKey]);
  const canWrite = canAccessArea(getStoredUser()?.role, "support", "write");

  const columns: {
    key: string;
    label: string;
    render?: (row: Record<string, unknown>) => ReactNode;
  }[] = [
    { key: "subject", label: "Subject" },
    { key: "type", label: "Type" },
    { key: "status", label: "Status", render: (r) => <StatusTag status={String(r.status)} /> },
    {
      key: "createdAt",
      label: "Opened",
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
      <PlatformPageHeader title="Support" subtitle="Cross-tenant help desk queue." />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && <DataTable empty="No tickets." rows={data.items} columns={columns} />}
      {managing && (
        <SupportManageModal
          row={managing}
          onClose={() => setManaging(null)}
          onChanged={() => setReloadKey((k) => k + 1)}
        />
      )}
    </>
  );
}

function SupportManageModal({
  row,
  onClose,
  onChanged,
}: {
  row: Record<string, unknown>;
  onClose: () => void;
  onChanged: () => void;
}) {
  const id = String(row._id);
  const [status, setStatus] = useState(String(row.status ?? "open"));
  const [team, setTeam] = useState<{ userId: string; name: string }[]>([]);
  const [assignee, setAssignee] = useState("");
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [okNote, setOkNote] = useState("");

  useEffect(() => {
    fetchPlatformTeam()
      .then((t) => setTeam(t.filter((m) => m.status === "active")))
      .catch(() => setTeam([]));
  }, []);

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
      title={String(row.subject ?? "Ticket")}
      subtitle={String(row.type ?? "")}
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
        <label className="lbl">Status</label>
        <select className="inp" value={status} onChange={(e) => setStatus(e.target.value)}>
          {SUPPORT_TICKET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="btn btn-soft btn-sm"
        disabled={busy || status === row.status}
        onClick={() => run(() => setTicketStatus(id, status), "Status updated.")}
      >
        Save status
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <div className="field">
        <label className="lbl">Assign to</label>
        <select className="inp" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="">Select a team member…</option>
          {team.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="btn btn-soft btn-sm"
        disabled={busy || !assignee}
        onClick={() => run(() => assignTicket(id, assignee), "Ticket assigned.")}
      >
        Assign
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <div className="field">
        <label className="lbl">Reply</label>
        <textarea
          className="inp"
          rows={3}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />
        <label className="row" style={{ gap: 6, alignItems: "center", fontSize: 13, marginTop: 6 }}>
          <input
            type="checkbox"
            checked={internal}
            onChange={(e) => setInternal(e.target.checked)}
          />{" "}
          Internal note (not sent to customer)
        </label>
      </div>
      <button
        type="button"
        className="btn btn-brand btn-sm"
        disabled={busy || !reply.trim()}
        onClick={() =>
          run(async () => {
            await addTicketMessage(id, reply.trim(), internal);
            setReply("");
          }, "Reply added.")
        }
      >
        Send reply
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <div className="row" style={{ gap: 8 }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={busy}
          onClick={() => run(() => resendRedemptionLink(id), "Redemption link resent.")}
        >
          Resend redemption link
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={busy}
          onClick={() => run(() => resendTicketTracking(id), "Tracking link resent.")}
        >
          Resend tracking link
        </button>
      </div>
    </PlatformModal>
  );
}
