import type { ReactNode } from "react";

/** Consistent inner page layout for cart, orders, checkout. */
export function StorePageShell({
  backLabel,
  onBack,
  title,
  subtitle,
  children,
}: {
  backLabel: string;
  onBack: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="sf-page-shell">
      <button type="button" className="sf-page-back" onClick={onBack}>
        {backLabel}
      </button>
      <header className="sf-page-header">
        <h1 className="sf-page-title">{title}</h1>
        {subtitle ? <p className="sf-page-subtitle">{subtitle}</p> : null}
      </header>
      {children}
    </div>
  );
}
