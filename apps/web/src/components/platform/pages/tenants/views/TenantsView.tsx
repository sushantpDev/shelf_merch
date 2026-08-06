import { type ReactNode } from "react";
import {
  DataTable,
  inr,
  PlatformError,
  PlatformLoading,
  PlatformPageHeader,
  StatusTag,
} from "../../../platform-ui";
import type { TenantsVm } from "../controllers/useTenantsController";
import type { TenantRow } from "../model";
import { TenantManageModal } from "./TenantManageModal";

function WalletBudgetCell({ row }: { row: Record<string, unknown> }) {
  const budget = Number(row.walletBudgetBalanceInr ?? row.walletBalanceInr ?? 0);
  const allocated = Number(row.walletAllocatedInr ?? 0);
  const available = Number(row.walletAvailableInr ?? Math.max(0, budget - allocated));
  return (
    <div className="platform-tenant-wallet">
      <div className="platform-tenant-wallet__row">
        <span className="platform-tenant-wallet__label">Budget</span>
        <span className="platform-tenant-wallet__value num">{inr(budget)}</span>
      </div>
      <div className="platform-tenant-wallet__row">
        <span className="platform-tenant-wallet__label">Allocated</span>
        <span className="platform-tenant-wallet__value num">{inr(allocated)}</span>
      </div>
      <div className="platform-tenant-wallet__row">
        <span className="platform-tenant-wallet__label">Available</span>
        <span className="platform-tenant-wallet__value num platform-tenant-wallet__value--avail">
          {inr(available)}
        </span>
      </div>
    </div>
  );
}

/** All workspaces on the platform. */
export function TenantsView({
  data,
  error,
  loading,
  canWrite,
  managing,
  onManage,
  onCloseManage,
  onTenantsChanged,
}: TenantsVm) {
  const columns: {
    key: string;
    label: string;
    render?: (row: Record<string, unknown>) => ReactNode;
  }[] = [
    { key: "name", label: "Tenant" },
    { key: "slug", label: "Slug" },
    { key: "status", label: "Status", render: (r) => <StatusTag status={String(r.status)} /> },
    { key: "plan", label: "Plan", render: (r) => String(r.plan ?? "—") },
    {
      key: "walletBudgetBalanceInr",
      label: "Wallet",
      render: (r) => <WalletBudgetCell row={r} />,
    },
    { key: "openOrders", label: "Open orders" },
  ];

  if (canWrite) {
    columns.push({
      key: "manage",
      label: "",
      render: (r) => (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onManage(r as unknown as TenantRow)}
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
        <TenantManageModal row={managing} onClose={onCloseManage} onChanged={onTenantsChanged} />
      )}
    </>
  );
}
