import type { ReactNode } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";

export type PlatformSelectOption = { value: string; label: string };

/** Rounded custom select — avoids native OS menus with square corners / mismatched width. */
export function PlatformSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: PlatformSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <SelectPrimitive.Root
      value={value || undefined}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        className={`platform-select-trigger${className ? ` ${className}` : ""}`}
        aria-label={placeholder}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown size={16} strokeWidth={2.25} style={{ flexShrink: 0, opacity: 0.55 }} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="platform-select-content"
          position="popper"
          sideOffset={6}
        >
          <SelectPrimitive.Viewport className="platform-select-viewport">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                className="platform-select-item"
              >
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="platform-select-check">
                  <Check size={14} strokeWidth={2.5} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export function PlatformModal({
  title,
  subtitle,
  onClose,
  children,
  size = "md",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  /** md ≈ 460px (default); lg ≈ 1140px for denser manage UIs */
  size?: "md" | "lg";
}) {
  const maxWidth = size === "lg" ? 1140 : 460;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.4)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
        padding: size === "lg" ? 16 : 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{
          padding: size === "lg" ? "24px 28px" : 24,
          maxWidth,
          width: "100%",
          maxHeight: size === "lg" ? "92vh" : "88vh",
          overflow: size === "lg" ? "hidden" : "auto",
          display: size === "lg" ? "flex" : undefined,
          flexDirection: size === "lg" ? "column" : undefined,
        }}
      >
        <div
          className="row"
          style={{
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: subtitle ? 4 : 16,
            flex: "none",
          }}
        >
          <h3 style={{ fontSize: 18 }}>{title}</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        {subtitle && (
          <p className="muted" style={{ fontSize: 12, marginBottom: 16, flex: "none" }}>
            {subtitle}
          </p>
        )}
        <div style={{ flex: 1, minHeight: 0, overflow: size === "lg" ? "hidden" : undefined }}>
          {children}
        </div>
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
