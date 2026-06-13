import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  fetchAuditLogs,
  fetchFinanceOutstanding,
  fetchFundingApprovals,
  fetchPlatformDashboard,
  fetchPlatformInventory,
  fetchPlatformKits,
  fetchPlatformOrders,
  fetchPlatformProducts,
  fetchPlatformSettings,
  fetchPlatformShipments,
  fetchPlatformSupport,
  fetchPlatformTeam,
  fetchPlatformTenants,
  fetchProductionBoard,
} from "@/services/platform-api";
import {
  DataTable,
  inr,
  MetricGrid,
  PlatformError,
  PlatformLoading,
  PlatformPageHeader,
  StatusTag,
} from "./platform-ui";

function useLoad<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    loader()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Request failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading };
}

export function DashboardPage() {
  const { data, error, loading } = useLoad(() => fetchPlatformDashboard());

  return (
    <>
      <PlatformPageHeader
        title="Dashboard"
        subtitle="Morning glance across tenants, orders, inventory, and finance."
      />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <>
          <MetricGrid
            items={[
              ["Active tenants", data.cards.activeTenants],
              ["Total GMV", inr(data.cards.totalGmvInr)],
              ["Orders in progress", data.cards.ordersInProgress],
              ["Delayed orders", data.cards.delayedOrders],
              ["Open tickets", data.cards.openSupportTickets],
              ["Low stock items", data.cards.lowStockItems],
              ["Outstanding", inr(data.cards.outstandingPaymentsInr)],
            ]}
          />
          {Array.isArray((data.sections as { criticalAlerts?: unknown[] }).criticalAlerts) &&
          (data.sections as { criticalAlerts: unknown[] }).criticalAlerts.length > 0 ? (
            <div className="card" style={{ marginTop: 24, padding: 16 }}>
              <div className="h1" style={{ fontSize: 16, marginBottom: 12 }}>
                Critical alerts
              </div>
              <ul style={{ paddingLeft: 18, color: "var(--ink-2)" }}>
                {(data.sections as { criticalAlerts: Array<{ kind: string; count?: number; amountInr?: number }> }).criticalAlerts.map(
                  (a) => (
                    <li key={a.kind} style={{ marginBottom: 6 }}>
                      {a.kind.replace(/_/g, " ")}
                      {a.count != null ? ` (${a.count})` : ""}
                      {a.amountInr != null ? ` — ${inr(a.amountInr)}` : ""}
                    </li>
                  ),
                )}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}

export function TenantsPage() {
  const { data, error, loading } = useLoad(() => fetchPlatformTenants());

  return (
    <>
      <PlatformPageHeader title="Tenants" subtitle="All workspaces on the platform." />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <DataTable
          empty="No tenants yet."
          rows={data as unknown as Record<string, unknown>[]}
          columns={[
            { key: "name", label: "Tenant" },
            { key: "slug", label: "Slug" },
            {
              key: "status",
              label: "Status",
              render: (r) => <StatusTag status={String(r.status)} />,
            },
            { key: "plan", label: "Plan", render: (r) => String(r.plan ?? "—") },
            {
              key: "walletBalanceInr",
              label: "Wallet",
              render: (r) => inr(Number(r.walletBalanceInr)),
            },
            { key: "openOrders", label: "Open orders" },
            {
              key: "outstandingInr",
              label: "Outstanding",
              render: (r) => inr(Number(r.outstandingInr)),
            },
          ]}
        />
      )}
    </>
  );
}

export function OrdersPage() {
  const { data, error, loading } = useLoad(() => fetchPlatformOrders({ limit: 100 }));

  return (
    <>
      <PlatformPageHeader title="Orders" subtitle="Cross-tenant order pipeline." />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <DataTable
          empty="No orders yet."
          rows={data.items}
          columns={[
            { key: "orderNumber", label: "Order #" },
            { key: "tenantName", label: "Tenant" },
            {
              key: "status",
              label: "Status",
              render: (r) => <StatusTag status={String(r.status)} />,
            },
            {
              key: "total",
              label: "Total",
              render: (r) => {
                const b = r.amountBreakdown as { total?: number } | undefined;
                return inr(Number(b?.total ?? 0));
              },
            },
            {
              key: "createdAt",
              label: "Created",
              render: (r) => new Date(String(r.createdAt)).toLocaleDateString("en-IN"),
            },
          ]}
        />
      )}
    </>
  );
}

export function CatalogPage() {
  const { data, error, loading } = useLoad(() => fetchPlatformProducts({ limit: 100 }));

  return (
    <>
      <PlatformPageHeader title="Catalog" subtitle="Platform product master with internal cost and margin." />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <DataTable
          empty="No products yet."
          rows={data.items as unknown as Record<string, unknown>[]}
          columns={[
            { key: "name", label: "Product" },
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

export function InventoryPage() {
  const { data, error, loading } = useLoad(() => fetchPlatformInventory(100));

  return (
    <>
      <PlatformPageHeader title="Inventory" subtitle="Stock levels and low-stock alerts." />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <DataTable
          empty="No inventory rows."
          rows={data.items as unknown as Record<string, unknown>[]}
          columns={[
            { key: "name", label: "Product" },
            { key: "sku", label: "SKU" },
            { key: "available", label: "Available" },
            { key: "reserved", label: "Reserved" },
            { key: "lowStockThreshold", label: "Threshold" },
            {
              key: "stockStatus",
              label: "Status",
              render: (r) => <StatusTag status={String(r.stockStatus)} />,
            },
          ]}
        />
      )}
    </>
  );
}

export function KitsPage() {
  const { data, error, loading } = useLoad(() => fetchPlatformKits());

  return (
    <>
      <PlatformPageHeader title="Kits" subtitle="Platform-curated gift bundles." />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <DataTable
          empty="No kits yet."
          rows={data as unknown as Record<string, unknown>[]}
          columns={[
            { key: "name", label: "Kit" },
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

export function ShipmentsPage() {
  const { data, error, loading } = useLoad(() => fetchPlatformShipments(100));

  return (
    <>
      <PlatformPageHeader title="Shipments" subtitle="AWB tracking and delivery exceptions." />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <DataTable
          empty="No shipments yet."
          rows={data.items}
          columns={[
            { key: "awb", label: "AWB", render: (r) => String(r.awb ?? r.trackingNumber ?? "—") },
            { key: "courier", label: "Courier" },
            {
              key: "status",
              label: "Status",
              render: (r) => <StatusTag status={String(r.status)} />,
            },
            {
              key: "createdAt",
              label: "Created",
              render: (r) => new Date(String(r.createdAt)).toLocaleDateString("en-IN"),
            },
          ]}
        />
      )}
    </>
  );
}

export function SupportPage() {
  const { data, error, loading } = useLoad(() => fetchPlatformSupport(100));

  return (
    <>
      <PlatformPageHeader title="Support" subtitle="Cross-tenant help desk queue." />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <DataTable
          empty="No tickets."
          rows={data.items}
          columns={[
            { key: "subject", label: "Subject" },
            { key: "type", label: "Type" },
            {
              key: "status",
              label: "Status",
              render: (r) => <StatusTag status={String(r.status)} />,
            },
            {
              key: "createdAt",
              label: "Opened",
              render: (r) => new Date(String(r.createdAt)).toLocaleDateString("en-IN"),
            },
          ]}
        />
      )}
    </>
  );
}

export function ProductionPage() {
  const { data, error, loading } = useLoad(() => fetchProductionBoard());

  return (
    <>
      <PlatformPageHeader title="Production" subtitle="Task board and orders in production." />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="h1" style={{ fontSize: 16, marginBottom: 12 }}>
              Tasks by status
            </div>
            {Object.entries(data.taskBuckets).map(([status, bucket]) => (
              <div key={status} className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <StatusTag status={status} />
                <span className="num">{bucket.count}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="h1" style={{ fontSize: 16, marginBottom: 12 }}>
              Orders in production
            </div>
            {Object.entries(data.orderBuckets).map(([status, bucket]) =>
              bucket.count > 0 ? (
                <div key={status} className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                  <StatusTag status={status} />
                  <span className="num">{bucket.count}</span>
                </div>
              ) : null,
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function FinancePage() {
  const outstanding = useLoad(() => fetchFinanceOutstanding());
  const funding = useLoad(() => fetchFundingApprovals());

  return (
    <>
      <PlatformPageHeader title="Finance" subtitle="Outstanding balances and wallet funding approvals." />
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
            columns={[
              { key: "walletName", label: "Wallet" },
              { key: "tenantName", label: "Tenant" },
              {
                key: "balance",
                label: "Balance",
                render: (r) => inr(Number(r.balance ?? 0)),
              },
              {
                key: "fundingDocument",
                label: "Status",
                render: (r) => {
                  const doc = r.fundingDocument as { approvalStatus?: string } | undefined;
                  return <StatusTag status={String(doc?.approvalStatus ?? "pending")} />;
                },
              },
            ]}
          />
        </div>
      )}
    </>
  );
}

export function TeamPage() {
  const { data, error, loading } = useLoad(() => fetchPlatformTeam());

  return (
    <>
      <PlatformPageHeader title="Platform Users" subtitle="Internal ShelfMerch team and roles." />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <DataTable
          empty="No platform users."
          rows={data as unknown as Record<string, unknown>[]}
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            {
              key: "role",
              label: "Role",
              render: (r) => String(r.role).replace(/_/g, " "),
            },
            {
              key: "status",
              label: "Status",
              render: (r) => <StatusTag status={String(r.status)} />,
            },
          ]}
        />
      )}
    </>
  );
}

export function AuditPage() {
  const { data, error, loading } = useLoad(() => fetchAuditLogs(100));

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

export function SettingsPage() {
  const { data, error, loading } = useLoad(() => fetchPlatformSettings());

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
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
            Edit controls for settings will wire to <code>PUT /platform/settings/:key</code> in a follow-up.
          </p>
        </div>
      )}
    </>
  );
}

export function PlatformIndexRedirect() {
  return (
    <div className="muted">
      Redirecting… <Link to="/platform/dashboard">Go to dashboard</Link>
    </div>
  );
}
