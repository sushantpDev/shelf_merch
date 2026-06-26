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
        <>
          <div className="search" style={{ marginBottom: 18 }}>
            <Search size={17} aria-hidden="true" />
            <input
              aria-label="Search orders"
              placeholder="Search by order name or ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="card">
            {filtered.length === 0 ? (
              <div className="empty" style={{ padding: "40px 0", textAlign: "center" }}>
                <h3>No matching orders</h3>
                <p className="muted">Try a different order name or ID.</p>
              </div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Order details</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr
                      key={o.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelected(o)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Open order ${o.name}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelected(o);
                        }
                      }}
                    >
                      <td className="num">{o.date}</td>
                      <td style={{ fontWeight: 600 }}>{o.name}</td>
                      <td>
                        <OrderStatusTag status={o.status} />
                      </td>
                      <td className="num" style={{ fontWeight: 600 }}>
                        {inr(o.amount)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="lnk">{o.track ? "Tracking" : "View"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      <OrderDetailDialog order={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  );
}
