import { type ReactNode } from "react";
import {
  DataTable,
  PlatformError,
  PlatformLoading,
  PlatformPageHeader,
  StatusTag,
} from "../../../platform-ui";
import type { SupportVm } from "../controllers/useSupportController";
import { SupportManageModal } from "./SupportManageModal";

/** Cross-tenant help desk queue. */
const FILTERS: Array<{ key: "all" | "mine" | "unassigned"; label: string }> = [
  { key: "all", label: "All tickets" },
  { key: "mine", label: "Assigned to me" },
  { key: "unassigned", label: "Unassigned" },
];

export function SupportView({
  data,
  error,
  loading,
  canWrite,
  filter,
  onFilter,
  managing,
  onManage,
  onCloseManage,
  onReload,
}: SupportVm) {
  const columns: {
    key: string;
    label: string;
    render?: (row: Record<string, unknown>) => ReactNode;
  }[] = [
    { key: "subject", label: "Subject" },
    { key: "tenantName", label: "Tenant", render: (r) => String(r.tenantName ?? "") || "—" },
    { key: "type", label: "Type" },
    { key: "status", label: "Status", render: (r) => <StatusTag status={String(r.status)} /> },
    {
      key: "assigneeName",
      label: "Assignee",
      render: (r) => String(r.assigneeName ?? "") || "—",
    },
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
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onManage(r)}>
          Manage
        </button>
      ),
    });
  }

  return (
    <>
      <PlatformPageHeader title="Support" subtitle="Cross-tenant help desk queue." />
      <div className="tabs" style={{ maxWidth: 420, marginBottom: 14 }} role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            className={filter === f.key ? "on" : ""}
            onClick={() => onFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && <DataTable empty="No tickets." rows={data.items} columns={columns} />}
      {managing && (
        <SupportManageModal row={managing} onClose={onCloseManage} onChanged={onReload} />
      )}
    </>
  );
}
