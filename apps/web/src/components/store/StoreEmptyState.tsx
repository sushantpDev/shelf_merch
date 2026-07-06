import type { ReactNode } from "react";

function EmptyBagIllustration() {
  return (
    <svg
      className="sf-empty-illus"
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="28" y="32" width="52" height="56" rx="8" fill="#F4F6F4" stroke="#D8DED9" strokeWidth="1.5" />
      <path
        d="M42 32V26a18 18 0 0136 0v6"
        stroke="#B8C4BC"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="46" y="48" width="16" height="3" rx="1.5" fill="#D8DED9" />
      <rect x="46" y="56" width="24" height="3" rx="1.5" fill="#E8ECE9" />
      <circle cx="88" cy="28" r="14" fill="#F8FAF9" stroke="#E2E8E4" strokeWidth="1.5" />
      <path d="M82 28h12M88 22v12" stroke="#C5D0CA" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function EmptyOrdersIllustration() {
  return (
    <svg
      className="sf-empty-illus"
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="22" y="24" width="76" height="58" rx="10" fill="#F4F6F4" stroke="#D8DED9" strokeWidth="1.5" />
      <rect x="34" y="40" width="36" height="4" rx="2" fill="#D8DED9" />
      <rect x="34" y="50" width="52" height="4" rx="2" fill="#E8ECE9" />
      <rect x="34" y="60" width="44" height="4" rx="2" fill="#E8ECE9" />
      <circle cx="88" cy="72" r="16" fill="#fff" stroke="#D8DED9" strokeWidth="1.5" />
      <path
        d="M82 72l4 4 8-8"
        stroke="#15784C"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Variant = "cart" | "orders" | "search";

export function StoreEmptyState({
  variant,
  title,
  description,
  action,
}: {
  variant: Variant;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const illus =
    variant === "orders" ? <EmptyOrdersIllustration /> : <EmptyBagIllustration />;

  return (
    <div className="sf-empty-state">
      {illus}
      <h2 className="sf-empty-state-title">{title}</h2>
      <p className="sf-empty-state-desc">{description}</p>
      {action ? <div className="sf-empty-state-action">{action}</div> : null}
    </div>
  );
}
