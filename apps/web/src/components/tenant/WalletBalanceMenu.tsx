import { useEffect, useState, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router";
import type { UiWallet } from "@/services/mappers";
import { formatWalletAmount, walletUnallocated } from "@/lib/walletFormat";
import walletIconImg from "../../../assets/wallet-icon.svg";

function TopbarChevron({ open }: { open: boolean }) {
  return (
    <svg
      className="topbar-chevron"
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

type Props = {
  wallets: UiWallet[];
  totalLabel: string;
  currentWalletId?: string;
  balanceCaption?: string;
  itemBalance?: (wallet: UiWallet) => string;
};

export function WalletBalanceMenu({
  wallets,
  totalLabel,
  currentWalletId,
  balanceCaption = "Available balance",
  itemBalance,
}: Props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
  }

  function openWallet(walletId: string) {
    close();
    void navigate(`/app/wallets?wallet=${encodeURIComponent(walletId)}`);
  }

  function openAddFunds(e: MouseEvent, walletId: string) {
    e.preventDefault();
    e.stopPropagation();
    close();
    void navigate(`/app/wallets?wallet=${encodeURIComponent(walletId)}&addFunds=1`);
  }

  return (
    <div className="wallet-menu-wrap">
      <button
        type="button"
        className="topbar-wallet"
        aria-label="Wallet balance"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="topbar-wallet-icon">
          <img src={walletIconImg} alt="" className="topbar-wallet-img" aria-hidden="true" />
        </span>
        <span className="topbar-wallet-copy">
          <span className="k">Wallet balance</span>
          <span className="v">
            {totalLabel}
            <TopbarChevron open={open} />
          </span>
        </span>
      </button>

      {open ? (
        <>
          <button type="button" className="user-menu-scrim" aria-label="Close menu" onClick={close} />
          <div className="wallet-menu-panel" role="menu" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-menu-body">
              {wallets.length === 0 ? (
                <div className="wallet-menu-empty">No wallets yet</div>
              ) : (
                wallets.map((w) => {
                  const selected = currentWalletId === w.id;
                  return (
                    <div
                      key={w.id}
                      className={`wallet-menu-item${selected ? " on" : ""}`}
                      role="menuitem"
                    >
                      <button
                        type="button"
                        className="wallet-menu-item-open"
                        onClick={() => openWallet(w.id)}
                      >
                        <span className="wallet-menu-item-name">{w.name}</span>
                        <span className="wallet-menu-item-bal">
                          {balanceCaption}:{" "}
                          {itemBalance
                            ? itemBalance(w)
                            : formatWalletAmount(walletUnallocated(w), w.cur)}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="wallet-menu-item-funds"
                        onClick={(e) => openAddFunds(e, w.id)}
                      >
                        Add funds
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            <div className="wallet-menu-foot">
              <Link to="/app/wallets" className="wallet-menu-create" onClick={close}>
                + Create wallet
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
