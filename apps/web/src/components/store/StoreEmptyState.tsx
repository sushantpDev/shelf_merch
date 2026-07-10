import type { ReactNode } from "react";
import emptyBagImg from "../../../assets/empty-bag.svg";

function EmptyBagIllustration() {
  return (
    <img
      src={emptyBagImg}
      alt=""
      className="sf-empty-illus sf-empty-illus--bag"
      width={119}
      height={104}
      aria-hidden="true"
    />
  );
}

function EmptySearchIllustration() {
  return (
    <svg
      className="sf-empty-illus"
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="28" y="32" width="52" height="56" rx="8" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />
      <path
        d="M42 32V26a18 18 0 0136 0v6"
        stroke="#94A3B8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="46" y="48" width="16" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="46" y="56" width="24" height="3" rx="1.5" fill="#E2E8F0" />
      <circle cx="88" cy="28" r="14" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
      <path d="M82 28h12M88 22v12" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
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
      <rect x="22" y="24" width="76" height="58" rx="10" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />
      <rect x="34" y="40" width="36" height="4" rx="2" fill="#CBD5E1" />
      <rect x="34" y="50" width="52" height="4" rx="2" fill="#E2E8F0" />
      <rect x="34" y="60" width="44" height="4" rx="2" fill="#E2E8F0" />
      <circle cx="88" cy="72" r="16" fill="#fff" stroke="#CBD5E1" strokeWidth="1.5" />
      <path
        d="M82 72l4 4 8-8"
        stroke="#3D5FD9"
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
  description: ReactNode;
  action?: ReactNode;
}) {
  const illus =
    variant === "orders" ? (
      <EmptyOrdersIllustration />
    ) : variant === "cart" ? (
      <EmptyBagIllustration />
    ) : (
      <EmptySearchIllustration />
    );

  return (
    <div className={`sf-empty-state${variant === "cart" ? " sf-empty-state--cart" : ""}`}>
      {illus}
      <h2 className="sf-empty-state-title">{title}</h2>
      <p className="sf-empty-state-desc">{description}</p>
      {action ? <div className="sf-empty-state-action">{action}</div> : null}
    </div>
  );
}
