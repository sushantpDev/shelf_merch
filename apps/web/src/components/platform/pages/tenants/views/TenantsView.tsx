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
