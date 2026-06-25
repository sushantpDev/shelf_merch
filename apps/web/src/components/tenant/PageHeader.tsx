import type { ReactNode } from "react";

/** Tenant page header — mirrors the platform `PlatformPageHeader` markup. */
export function PageHeader({
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
        <h1>{title}</h1>
        {subtitle && <div className="sub">{subtitle}</div>}
      </div>
      {actions && (
        <div className="row" style={{ gap: 8 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
