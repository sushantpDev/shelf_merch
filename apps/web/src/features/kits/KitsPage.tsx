import { useState, type ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import { Package, Plus, Radio, Search, Send, Users } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/tenant/PageHeader";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { UiKit } from "@/services/mappers";
import { KitDetailDialog } from "./KitDetailDialog";
import { KitsEmptyState } from "./KitsEmptyState";
import { kitLaunch } from "./hooks";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: ComponentType<{ size?: number }>;
}) {
  return (
    <div
      className="card stat"
      style={{
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span className="k" style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}>
          {label}
        </span>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "#EAF5EF",
            display: "grid",
            placeItems: "center",
            color: "var(--brand)",
          }}
        >
          <Icon size={18} />
        </div>
      </div>
      <div
        className="v num"
        style={{
          fontFamily: "var(--disp)",
          fontWeight: 800,
          fontSize: 26,
          marginTop: 2,
          letterSpacing: "-.03em",
          color: "var(--ink)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function KitsPage() {
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const [detail, setDetail] = useState<UiKit | null>(null);

  if (isLoading && !workspace) {
    return <LoadingState message="Loading kits…" fullScreen={false} />;
  }
  if (isError || !workspace) {
    return (
      <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
        {error instanceof Error ? error.message : "Could not load kits"}
      </div>
    );
  }

  const kits = workspace.kits;
  const total = kits.length;
  const live = kits.filter((k) => k.status === "live").length;
  const sent = kits.filter((k) => k.sent).length;

  if (total === 0) {
    return <KitsEmptyState />;
  }

  return (
    <>
      <PageHeader
        title="Kits & Items"
        subtitle="Package catalog products into reusable gift kits, then send them at scale."
        actions={
          <Link to="/app/kits/new" className="btn btn-brand">
            <Plus size={16} /> Create a kit
          </Link>
        }
      />

      <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 18 }}>
        <StatCard label="Total kits" value={total} icon={Package} />
        <StatCard label="Live kits" value={live} icon={Radio} />
        <StatCard label="Kits sent" value={sent} icon={Send} />
        <StatCard label="Recipients reached" value="45" icon={Users} />
      </div>

      <div className="card" style={{ padding: 22 }}>
        <div
          className="row"
          style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}
        >
          <h3 style={{ fontSize: 17 }}>Your kits</h3>
          <div className="search" style={{ maxWidth: 260 }}>
            <Search size={16} aria-hidden="true" />
            <input style={{ height: 36 }} placeholder="Search kits" aria-label="Search kits" />
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Kit</th>
              <th>Items</th>
              <th>Status</th>
              <th>Last sent</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {kits.map((kit) => (
              <tr key={kit.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{kit.name}</div>
                  <div className="mut3" style={{ fontSize: 11.5 }}>
                    Reusable kit
                  </div>
                </td>
                <td className="num">{kit.items}</td>
                <td>
                  {kit.status === "live" ? (
                    <span className="tag tag-live">
                      <span className="dot" />
                      Live
                    </span>
                  ) : (
                    <span className="tag tag-draft">Draft</span>
                  )}
                </td>
                <td className="muted">{kit.sent ? "Recently" : "Not yet"}</td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setDetail(kit)}
                  >
                    Details
                  </button>{" "}
                  <button
                    type="button"
                    className="btn btn-dark btn-sm"
                    onClick={() => kitLaunch.send(kit.id)}
                  >
                    Send
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <KitDetailDialog
        kit={detail}
        catalog={workspace.catalogProducts}
        onOpenChange={(open) => !open && setDetail(null)}
      />
    </>
  );
}
