import { Link } from "react-router";
import {
  DataTable,
  inr,
  PlatformError,
  PlatformLoading,
  PlatformPageHeader,
  StatusTag,
} from "../../../platform-ui";
import type { CatalogVm } from "../controllers/useCatalogController";

/** Platform product master with internal cost and margin. */
export function CatalogView({ data, error, loading, canWrite }: CatalogVm) {
  return (
    <>
      <PlatformPageHeader
        title="Catalog"
        subtitle="Platform product master with internal cost and margin."
        actions={
          canWrite ? (
            <>
              <Link to="/platform/catalog/import" className="btn btn-ghost btn-sm">
                Import from Shopify
              </Link>
              <Link to="/platform/catalog/new" className="btn btn-brand btn-sm">
                + New product
              </Link>
            </>
          ) : null
        }
      />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <DataTable
          empty="No products yet."
          rows={data.items as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: "name",
              label: "Product",
              render: (r) => (
                <Link to={`/platform/catalog/${String(r._id)}`} className="lnk">
                  {String(r.name)}
                </Link>
              ),
            },
            { key: "sku", label: "SKU" },
            {
              key: "status",
              label: "Status",
              render: (r) => <StatusTag status={String(r.status)} />,
            },
            {
              key: "sellingPriceInr",
              label: "Sell",
              render: (r) => inr(Number(r.sellingPriceInr)),
            },
            {
              key: "costPriceInr",
              label: "Cost",
              render: (r) => inr(Number(r.costPriceInr)),
            },
            {
              key: "marginPct",
              label: "Margin",
              render: (r) => `${Number(r.marginPct)}%`,
            },
            {
              key: "stock",
              label: "Available",
              render: (r) => String((r.inventory as { available?: number })?.available ?? 0),
            },
          ]}
        />
      )}
    </>
  );
}
