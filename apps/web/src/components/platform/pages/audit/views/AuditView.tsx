import { DataTable, PlatformError, PlatformLoading, PlatformPageHeader } from "../../../platform-ui";
import type { AuditVm } from "../controllers/useAuditController";

/** Immutable trail of platform actions. */
export function AuditView({ data, error, loading }: AuditVm) {
  return (
    <>
      <PlatformPageHeader title="Audit Logs" subtitle="Immutable trail of platform actions." />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <DataTable
          empty="No audit events."
          rows={data.items}
          columns={[
            { key: "action", label: "Action" },
            { key: "entityType", label: "Entity" },
            { key: "entityId", label: "ID", render: (r) => String(r.entityId).slice(-8) },
            {
              key: "createdAt",
              label: "When",
              render: (r) => new Date(String(r.createdAt)).toLocaleString("en-IN"),
            },
          ]}
        />
      )}
    </>
  );
}
