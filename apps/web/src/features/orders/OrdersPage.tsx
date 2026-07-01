import { useMemo, useState } from "react";
import { Receipt, Search } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/tenant/PageHeader";
import { inr } from "@/components/platform/platform-ui";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { UiOrder } from "@/services/mappers";
import { OrderDetailDialog } from "./OrderDetailDialog";
import { OrderStatusTag } from "./OrderStatusTag";

const SUBTITLE = "Track every swag, kit and points order across your workspace.";

export function OrdersPage() {
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<UiOrder | null>(null);

  const orders = workspace?.orders ?? [];
  const filtered = useMemo(() => {
    const list = workspace?.orders ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (o) => o.name.toLowerCase().includes(q) || o.orderNumber.toLowerCase().includes(q),
    );
  }, [workspace?.orders, query]);

  if (isLoading && !workspace) {
    return <LoadingState message="Loading orders…" fullScreen={false} />;
  }
  if (isError || !workspace) {
    return (
      <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
        {error instanceof Error ? error.message : "Could not load orders"}
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Orders" subtitle={SUBTITLE} />

      {orders.length === 0 ? (
        <div className="card empty">
          <div className="ic" aria-hidden="true">
            <Receipt size={34} color="#cdd6cf" />
          </div>
          <h3>No orders yet</h3>
          <p>Orders appear here when recipients redeem gifts or you send kits at scale.</p>
        </div>
      ) : (
        <div className="card data-list-card orders-list">
          <div className="data-list-title">Order history</div>

          <div className="data-list-search">
            <Search size={17} aria-hidden="true" />
            <input
              aria-label="Search orders"
              placeholder="Search by order name or ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="data-list-empty">
              <h4>No matching orders</h4>
              <p className="muted" style={{ fontSize: 13 }}>Try a different order name or ID.</p>
            </div>
          ) : (
            <table className="tbl data-list-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Order details</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    className="data-list-row"
                    onClick={() => setSelected(o)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open order ${o.orderNumber}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(o);
                      }
                    }}
                  >
                    <td className="muted data-list-cell">{o.date}</td>
                    <td className="data-list-cell">
                      <div className="data-list-primary">{o.orderNumber}</div>
                      {o.name && o.name !== o.orderNumber ? (
                        <div className="data-list-secondary">{o.name}</div>
                      ) : null}
                    </td>
                    <td className="data-list-cell">
                      <OrderStatusTag status={o.status} />
                    </td>
                    <td className="num data-list-cell data-list-amount">{inr(o.amount)}</td>
                    <td className="data-list-cell">
                      <span className="lnk">{o.track ? "Tracking" : "View"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <OrderDetailDialog order={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  );
}
