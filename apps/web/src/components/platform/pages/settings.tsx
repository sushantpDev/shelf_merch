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

export function SettingsPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState<{ key: string; value: unknown } | null>(null);
  const { data, error, loading } = useLoad(() => fetchPlatformSettings(), [reloadKey]);
  const canWrite = canAccessArea(getStoredUser()?.role, "settings", "write");

  return (
    <>
      <PlatformPageHeader title="Settings" subtitle="Platform-wide configuration." />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <div className="card" style={{ padding: 16 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
                {canWrite && <th></th>}
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([key, value]) => (
                <tr key={key}>
                  <td>
                    <code>{key}</code>
                  </td>
                  <td>
                    <code>{JSON.stringify(value)}</code>
                  </td>
                  {canWrite && (
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditing({ key, value })}
                      >
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <SettingEditModal
          settingKey={editing.key}
          initial={editing.value}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            setReloadKey((k) => k + 1);
          }}
        />
      )}
    </>
  );
}

function SettingEditModal({
  settingKey,
  initial,
  onClose,
  onDone,
}: {
  settingKey: string;
  initial: unknown;
  onClose: () => void;
  onDone: () => void;
}) {
  const [text, setText] = useState(JSON.stringify(initial, null, 2));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setBusy(true);
    setErr("");
    // Accept JSON (objects, numbers, booleans); fall back to a raw string.
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch {
      value = text;
    }
    try {
      await updateSetting(settingKey, value);
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save setting");
      setBusy(false);
    }
  }

  return (
    <PlatformModal title="Edit setting" subtitle={settingKey} onClose={onClose}>
      {err && <PlatformError message={err} />}
      <div className="field">
        <label className="lbl">Value (JSON)</label>
        <textarea
          className="inp"
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ fontFamily: "monospace", fontSize: 13 }}
        />
      </div>
      <button type="button" className="btn btn-brand btn-block" disabled={busy} onClick={submit}>
        {busy ? "Saving…" : "Save setting"}
      </button>
    </PlatformModal>
  );
}
