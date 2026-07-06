import { Link } from "react-router";
import {
  DataTable,
  inr,
  PlatformError,
  PlatformLoading,
  PlatformPageHeader,
  StatusTag,
} from "../../../platform-ui";
import type { KitsVm } from "../controllers/useKitsController";

/** Platform-curated gift bundles. */
export function KitsView({ data, error, loading, canWrite }: KitsVm) {
  return (
    <>
      <PlatformPageHeader
        title="Kits"
        subtitle="Platform-curated gift bundles."
        actions={
          canWrite ? (
            <div className="row" style={{ gap: 8 }}>
              <Link to="/platform/kits/import" className="btn btn-soft btn-sm">
                Import from Shopify
              </Link>
              <Link to="/platform/kits/new" className="btn btn-brand btn-sm">
                + Create a kit
              </Link>
            </div>
          ) : null
        }
      />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <DataTable
          empty="No kits yet."
          rows={data as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: "name",
              label: "Kit",
              render: (r) => (
                <Link to={`/platform/kits/${String(r._id)}`} className="lnk">
                  {String(r.name)}
                </Link>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (r) => <StatusTag status={String(r.status)} />,
            },
            {
              key: "approxValueInr",
              label: "Approx value",
              render: (r) => inr(Number(r.approxValueInr)),
            },
            {
              key: "items",
              label: "Items",
              render: (r) => String(Array.isArray(r.items) ? r.items.length : 0),
            },
          ]}
        />
      )}
    </>
  );
}
