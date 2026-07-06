import { useEffect, useState } from "react";
import { LogOut, Package, Wallet } from "lucide-react";

function TopbarChevron({ open }: { open: boolean }) {
  return (
    <svg
      className="topbar-chevron sf-topbar-user-chevron"
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      aria-hidden="true"
      style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform .15s ease" }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export type StoreOrderSummary = {
  orderNumber: string;
  status: string;
  total?: number;
  itemCount?: number;
  createdAt?: string;
};

type StoreAccountMenuProps = {
  recipientName: string;
  recipientEmail?: string;
  shopName: string;
  initials: string;
  truncName: string;
  balanceLabel: string;
  balanceValue: string;
  orders: StoreOrderSummary[];
  ordersLoading?: boolean;
  onOpenOrders: () => void;
  onLogout: () => void;
  onRefreshOrders?: () => void;
};

export function StoreAccountMenu({
  recipientName,
  recipientEmail,
  shopName,
  initials,
  truncName,
  balanceLabel,
  balanceValue,
  orders,
  ordersLoading,
  onOpenOrders,
  onLogout,
  onRefreshOrders,
}: StoreAccountMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    onRefreshOrders?.();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onRefreshOrders]);

  function close() {
    setOpen(false);
  }

  return (
    <div className="user-menu-wrap sf-account-menu-wrap">
      <button
        type="button"
        className="topbar-user sf-topbar-user"
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="topbar-user-avatar">{initials}</span>
        <span className="topbar-user-copy">
          <span className="topbar-user-name">{truncName}</span>
          <span className="topbar-user-sub">{shopName.toLowerCase()}</span>
        </span>
        <TopbarChevron open={open} />
      </button>

      {open ? (
        <>
          <button type="button" className="user-menu-scrim" aria-label="Close menu" onClick={close} />
          <div className="user-menu-panel sf-account-menu-panel" role="menu" onClick={(e) => e.stopPropagation()}>
            <div className="user-menu-head">
              <div className="user-menu-name">{recipientName}</div>
              {recipientEmail ? (
                <div className="user-menu-email">{recipientEmail}</div>
              ) : (
                <div className="user-menu-email">{shopName} rewards store</div>
              )}
            </div>

            <div className="sf-account-balance-card">
              <div className="sf-account-balance-icon" aria-hidden="true">
                <Wallet size={18} strokeWidth={2} />
              </div>
              <div className="sf-account-balance-copy">
                <div className="sf-account-balance-k">{balanceLabel}</div>
                <div className="sf-account-balance-v">{balanceValue}</div>
              </div>
            </div>

            <div className="user-menu-body">
              <button
                type="button"
                className="user-menu-link sf-account-menu-link"
                role="menuitem"
                onClick={() => {
                  close();
                  onOpenOrders();
                }}
              >
                <Package size={16} strokeWidth={2} aria-hidden="true" />
                <span>My orders</span>
                {orders.length > 0 ? (
                  <span className="sf-account-menu-badge">{orders.length}</span>
                ) : null}
              </button>
            </div>

            {ordersLoading ? (
              <div className="sf-account-orders-preview mut3">Loading orders…</div>
            ) : orders.length > 0 ? (
              <div className="sf-account-orders-preview">
                {orders.slice(0, 2).map((o) => (
                  <div key={o.orderNumber} className="sf-account-order-row">
                    <span className="sf-account-order-num">#{o.orderNumber}</span>
                    <span className="sf-account-order-status">{formatOrderStatus(o.status)}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="user-menu-foot">
              <button
                type="button"
                className="user-menu-logout"
                onClick={() => {
                  close();
                  onLogout();
                }}
              >
                <LogOut size={15} strokeWidth={2} aria-hidden="true" />
                Log out
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function formatOrderStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
