import { type ReactNode } from "react";
import {
  DataTable,
  inr,
  PlatformError,
  PlatformLoading,
  PlatformPageHeader,
  StatusTag,
} from "../../../platform-ui";
import type { FinanceVm } from "../controllers/useFinanceController";
import type { FundingRow } from "../model";
import { FundingActionModal } from "./FundingActionModal";

/** Outstanding balances and wallet funding approvals. */
export function FinanceView({
  outstanding,
  funding,
  canWrite,
  acting,
  onApprove,
  onReject,
  onCloseAction,
  onFundingChanged,
}: FinanceVm) {
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
            onClick={() => onApprove(r as unknown as FundingRow)}
          >
            Approve
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onReject(r as unknown as FundingRow)}
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
          onClose={onCloseAction}
          onDone={onFundingChanged}
        />
      )}
    </>
  );
}
