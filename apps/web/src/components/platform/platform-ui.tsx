import type { ReactNode } from "react";
import { LoadingState } from "@/components/LoadingState";

export function PlatformModal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ padding: 24, maxWidth: 460, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: subtitle ? 4 : 16 }}>
          <h3 style={{ fontSize: 18 }}>{title}</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        {subtitle && <p className="muted" style={{ fontSize: 12, marginBottom: 16 }}>{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

export function inr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}

export function PlatformPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-h">
      <div>
        <div className="eyebrow">Platform</div>
        <h1>{title}</h1>
        {subtitle ? <p className="sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="row" style={{ gap: 8 }}>{actions}</div> : null}
    </div>
  );
}

export function PlatformLoading({ message = "Loading workspace…" }: { message?: string }) {
  return <LoadingState message={message} fullScreen={false} />;
}

export function PlatformError({ message }: { message: string }) {
  return <p style={{ color: "var(--danger)" }}>{message}</p>;
}

export function StatusTag({ status }: { status: string }) {
  const s = status.replace(/_/g, " ");
  const cls =
    status === "active" || status === "delivered" || status === "completed"
      ? "tag-live"
      : status === "draft" || status === "trial"
        ? "tag-draft"
        : status === "open" || status === "in_progress"
          ? "tag-proc"
          : "tag-warn";
  return (
    <span className={`tag ${cls}`}>
      <span className="dot" />
      {s}
    </span>
  );
}

export function DataTable({
  columns,
  rows,
  empty = "Nothing here yet.",
}: {
  columns: { key: string; label: string; render?: (row: Record<string, unknown>) => ReactNode }[];
  rows: Record<string, unknown>[];
  empty?: string;
}) {
  if (!rows.length) {
    return (
      <div className="card empty" style={{ padding: 40 }}>
        <h3>{empty}</h3>
      </div>
    );
  }
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <table className="tbl">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={String(row._id ?? row.id ?? row.productId ?? i)}>
              {columns.map((c) => (
                <td key={c.key}>
                  {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MetricGrid({ items }: { items: [string, string | number][] }) {
  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}
    >
      {items.map(([label, value]) => (
        <div key={label} className="card" style={{ padding: 16 }}>
          <div className="muted" style={{ fontSize: 13 }}>
            {label}
          </div>
          <div className="h1" style={{ fontSize: 24, marginTop: 8 }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}
