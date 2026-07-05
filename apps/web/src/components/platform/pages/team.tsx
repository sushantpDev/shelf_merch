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

type TeamRow = { userId: string; name: string; email: string; role: string; status: string };

const roleLabel = (r: string) => r.replace(/^platform_/, "").replace(/_/g, " ");

export function TeamPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [managing, setManaging] = useState<TeamRow | null>(null);
  const [inviting, setInviting] = useState(false);
  const { data, error, loading } = useLoad(() => fetchPlatformTeam(), [reloadKey]);
  const canWrite = canAccessArea(getStoredUser()?.role, "team", "write");
  const reload = () => setReloadKey((k) => k + 1);

  const columns: {
    key: string;
    label: string;
    render?: (row: Record<string, unknown>) => ReactNode;
  }[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", render: (r) => roleLabel(String(r.role)) },
    { key: "status", label: "Status", render: (r) => <StatusTag status={String(r.status)} /> },
  ];
  if (canWrite) {
    columns.push({
      key: "manage",
      label: "",
      render: (r) => (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setManaging(r as unknown as TeamRow)}
        >
          Manage
        </button>
      ),
    });
  }

  return (
    <>
      <PlatformPageHeader
        title="Platform Users"
        subtitle="Internal ShelfMerch team and roles."
        actions={
          canWrite ? (
            <button
              type="button"
              className="btn btn-brand btn-sm"
              onClick={() => setInviting(true)}
            >
              + Invite
            </button>
          ) : null
        }
      />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <DataTable
          empty="No platform users."
          rows={data as unknown as Record<string, unknown>[]}
          columns={columns}
        />
      )}
      {inviting && (
        <TeamInviteModal
          onClose={() => setInviting(false)}
          onDone={() => {
            setInviting(false);
            reload();
          }}
        />
      )}
      {managing && (
        <TeamManageModal row={managing} onClose={() => setManaging(null)} onChanged={reload} />
      )}
    </>
  );
}

function TeamInviteModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("platform_support_agent");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!name.trim() || !email.trim()) {
      setErr("Name and email are required.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await inviteTeamMember({ name: name.trim(), email: email.trim(), role });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not invite");
      setBusy(false);
    }
  }

  return (
    <PlatformModal title="Invite team member" onClose={onClose}>
      {err && <PlatformError message={err} />}
      <div className="field">
        <label className="lbl">Name</label>
        <input className="inp" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label className="lbl">Email</label>
        <input
          className="inp"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="field">
        <label className="lbl">Role</label>
        <select className="inp" value={role} onChange={(e) => setRole(e.target.value)}>
          {PLATFORM_ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
      </div>
      <button type="button" className="btn btn-brand btn-block" disabled={busy} onClick={submit}>
        {busy ? "Inviting…" : "Send invite"}
      </button>
    </PlatformModal>
  );
}

function TeamManageModal({
  row,
  onClose,
  onChanged,
}: {
  row: TeamRow;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [role, setRole] = useState(row.role);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const isActive = row.status === "active";

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
    <PlatformModal title={row.name} subtitle={row.email} onClose={onClose}>
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
        <label className="lbl">Role</label>
        <select className="inp" value={role} onChange={(e) => setRole(e.target.value)}>
          {PLATFORM_ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="btn btn-soft btn-sm"
        disabled={busy || role === row.role}
        onClick={() => run(() => changeTeamRole(row.userId, role), "Role updated.")}
      >
        Save role
      </button>
      <div className="divider" style={{ margin: "18px 0" }} />
      {isActive ? (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ color: "var(--danger)" }}
          disabled={busy}
          onClick={() => run(() => deactivateTeamMember(row.userId), "User deactivated.")}
        >
          Deactivate user
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-soft btn-sm"
          disabled={busy}
          onClick={() => run(() => reactivateTeamMember(row.userId), "User reactivated.")}
        >
          Reactivate user
        </button>
      )}
    </PlatformModal>
  );
}
