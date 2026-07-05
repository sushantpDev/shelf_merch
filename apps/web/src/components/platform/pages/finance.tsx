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

type FundingRow = {
  walletId: string;
  walletName: string;
  tenantName: string;
  balance: number;
  requestedAmount?: number;
  fundingDocument?: {
    docType?: string;
    docNumber?: string;
    fileUrl?: string;
    approvalStatus?: string;
  };
};

export function FinancePage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [acting, setActing] = useState<{ row: FundingRow; mode: "approve" | "reject" } | null>(
    null,
  );
  const outstanding = useLoad(() => fetchFinanceOutstanding());
  const funding = useLoad(() => fetchFundingApprovals(), [reloadKey]);
  const canWrite = canAccessArea(getStoredUser()?.role, "finance", "write");

  const fundingColumns: {
    key: string;
    label: string;
    render?: (row: Record<string, unknown>) => ReactNode;
  }[] = [
    { key: "tenantName", label: "Tenant" },
    { key: "walletName", label: "Wallet" },
    {
      key: "document",
      label: "Document",
      render: (r) => {
        const doc = r.fundingDocument as FundingRow["fundingDocument"];
        const label = [doc?.docType, doc?.docNumber].filter(Boolean).join(" · ") || "—";
        return doc?.fileUrl ? (
          <a className="lnk" href={String(doc.fileUrl)} target="_blank" rel="noreferrer">
            {label}
          </a>
        ) : (
          label
        );
      },
    },
    {
      key: "requestedAmount",
      label: "Requested",
      render: (r) => inr(Number(r.requestedAmount ?? 0)),
    },
    {
      key: "fundingDocument",
      label: "Status",
      render: (r) => {
        const doc = r.fundingDocument as { approvalStatus?: string } | undefined;
        return <StatusTag status={String(doc?.approvalStatus ?? "pending")} />;
      },
    },
  ];
  if (canWrite) {
    fundingColumns.push({
      key: "act",
      label: "",
      render: (r) => (
        <div className="row" style={{ gap: 6 }}>
          <button
            type="button"
            className="btn btn-brand btn-sm"
            onClick={() => setActing({ row: r as unknown as FundingRow, mode: "approve" })}
          >
            Approve
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setActing({ row: r as unknown as FundingRow, mode: "reject" })}
          >
            Reject
          </button>
        </div>
      ),
    });
  }

  return (
    <>
      <PlatformPageHeader
        title="Finance"
        subtitle="Outstanding balances and wallet funding approvals."
      />
      {(outstanding.loading || funding.loading) && <PlatformLoading />}
      {outstanding.error && <PlatformError message={outstanding.error} />}
      {funding.error && <PlatformError message={funding.error} />}
      {outstanding.data && (
        <>
          <h3 style={{ marginBottom: 12 }}>Outstanding by tenant</h3>
          <DataTable
            empty="No outstanding invoices."
            rows={outstanding.data as unknown as Record<string, unknown>[]}
            columns={[
              { key: "tenantName", label: "Tenant" },
              {
                key: "outstandingInr",
                label: "Outstanding",
                render: (r) => inr(Number(r.outstandingInr)),
              },
            ]}
          />
        </>
      )}
      {funding.data && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 12 }}>Funding approvals</h3>
          <DataTable
            empty="No pending funding requests."
            rows={(Array.isArray(funding.data) ? funding.data : []) as Record<string, unknown>[]}
            columns={fundingColumns}
          />
        </div>
      )}
      {acting && (
        <FundingActionModal
          row={acting.row}
          mode={acting.mode}
          onClose={() => setActing(null)}
          onDone={() => {
            setActing(null);
            setReloadKey((k) => k + 1);
          }}
        />
      )}
    </>
  );
}

function FundingActionModal({
  row,
  mode,
  onClose,
  onDone,
}: {
  row: FundingRow;
  mode: "approve" | "reject";
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState(row.requestedAmount || row.balance || 0);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      if (mode === "approve") {
        if (amount <= 0) throw new Error("Enter an amount greater than zero.");
        await approveFunding(row.walletId, amount);
      } else {
        if (!reason.trim()) throw new Error("A rejection reason is required.");
        await rejectFunding(row.walletId, reason.trim());
      }
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
      setBusy(false);
    }
  }

  return (
    <PlatformModal
      title={`${mode === "approve" ? "Approve" : "Reject"} funding`}
      subtitle={`${row.walletName} · ${row.tenantName}`}
      onClose={onClose}
    >
      {err && <PlatformError message={err} />}
      {mode === "approve" ? (
        <div className="field">
          <label className="lbl">Amount to credit (₹)</label>
          <input
            className="inp"
            type="number"
            min={1}
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          {row.requestedAmount ? (
            <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
              Requested by tenant: {inr(row.requestedAmount)}
              {row.fundingDocument?.docNumber ? ` · ${row.fundingDocument.docNumber}` : ""}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="field">
          <label className="lbl">Rejection reason</label>
          <input
            className="inp"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. proof of payment not attached"
          />
        </div>
      )}
      <button
        type="button"
        className={mode === "approve" ? "btn btn-brand btn-block" : "btn btn-dark btn-block"}
        disabled={busy}
        onClick={submit}
      >
        {busy ? "Working…" : mode === "approve" ? "Approve funding" : "Reject request"}
      </button>
    </PlatformModal>
  );
}
