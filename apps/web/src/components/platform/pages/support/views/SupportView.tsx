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
export function SupportView({
  data,
  error,
  loading,
  canWrite,
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
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onManage(r)}>
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
        <SupportManageModal row={managing} onClose={onCloseManage} onChanged={onReload} />
      )}
    </>
  );
}
