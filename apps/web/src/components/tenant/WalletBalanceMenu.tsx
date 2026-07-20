import { useEffect, useState, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router";
import { CircleDollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  hasBudget?: boolean;
  balanceCaption?: string;
  canRequestTopup?: boolean;
};

export function WalletBalanceMenu({
  wallets,
  totalLabel,
  hasBudget = wallets.length > 0,
  balanceCaption = "Available balance",
  canRequestTopup = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const primaryWallet = wallets[0];

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

  function openBudget() {
    close();
    void navigate("/app/wallets");
  }

  function openTopup(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    close();
    const walletId = primaryWallet?.id;
    void navigate(walletId ? `/app/wallets?wallet=${encodeURIComponent(walletId)}&addFunds=1` : "/app/wallets");
  }

  return (
    <div className="wallet-menu-wrap">
      <button
        type="button"
        className="topbar-wallet"
        aria-label="Organization budget"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="topbar-wallet-icon">
          <img src={walletIconImg} alt="" className="topbar-wallet-img" aria-hidden="true" />
        </span>
        <span className="topbar-wallet-copy">
          <span className="k">Organization budget</span>
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
              {!hasBudget ? (
                <div className="wallet-menu-empty">
                  <p className="mb-3 text-sm text-muted-foreground">No organization budget yet.</p>
                  <Button size="sm" asChild onClick={close}>
                    <Link to="/app/wallets" state={{ startCreateWallet: true }}>
                      Setup budget
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="wallet-menu-item on" role="menuitem">
                  <button type="button" className="wallet-menu-item-open" onClick={openBudget}>
                    <span className="wallet-menu-item-name">Organization budget</span>
                    <span className="wallet-menu-item-bal">
                      {balanceCaption}:{" "}
                      {primaryWallet
                        ? formatWalletAmount(walletUnallocated(primaryWallet), primaryWallet.cur)
                        : totalLabel}
                    </span>
                  </button>
                  {canRequestTopup ? (
                    <button type="button" className="wallet-menu-item-funds" onClick={openTopup}>
                      Request top-up
                    </button>
                  ) : null}
                </div>
              )}
            </div>
            <div className="wallet-menu-foot">
              <Link to="/app/wallets" className="wallet-menu-create" onClick={close}>
                {hasBudget ? "View budget dashboard" : "Setup budget"}
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
