import { useEffect } from "react";
import { Link, Outlet } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { CollapsibleSidebar } from "@/components/tenant/CollapsibleSidebar";
import { getStoredUser, isAuthenticated } from "@/services/api-bridge";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { WorkspaceSnapshot } from "@/services/workspace-api";
import walletIconImg from "../../../assets/wallet-icon.svg";
import "@/styles/shelf-merch.css";

function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U"
  );
}

function truncTopbarName(name: string, max = 16) {
  const n = name.trim();
  return n.length > max ? `${n.slice(0, max - 1)}…` : n;
}

function formatWalletBalance(workspace: WorkspaceSnapshot | undefined) {
  if (!workspace) return "₹0";
  if (workspace.userPatch.role === "entity_manager" && workspace.primaryEntityId) {
    const dept = workspace.org.departments.find(
      (d) => String(d.id) === String(workspace.primaryEntityId),
    );
    if (dept) {
      const rem = Math.max(0, (dept.allocated || 0) - (dept.spent || 0));
      return `₹${Math.round(rem).toLocaleString("en-IN")}`;
    }
  }
  const amount =
    workspace.org.active && workspace.org.wallet.amount != null
      ? workspace.org.wallet.amount
      : (workspace.wallets[0]?.balance ?? 0);
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function TopbarChevron() {
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
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function TenantLayout() {
  const user = getStoredUser();
  const { data: workspace } = useWorkspace();

  useEffect(() => {
    if (!isAuthenticated()) window.location.href = "/";
  }, []);

  if (!isAuthenticated()) return null;

  const account = workspace?.account ?? "Workspace";
  const userName = workspace?.userPatch?.name ?? user?.name ?? "User";
  const walletBalance = formatWalletBalance(workspace);

  return (
    <div className="tenant-shell">
      <header className="topbar">
        <div className="brandmark">
          <svg viewBox="0 0 32 32" fill="none" width={28} height={28} aria-hidden="true">
            <path d="M16 3 4 9l12 6 12-6-12-6Z" fill="#15784C" />
            <path d="M4 15l12 6 12-6" stroke="#0E5536" strokeWidth="2.4" strokeLinejoin="round" />
            <path d="M4 21l12 6 12-6" stroke="#1E8E5C" strokeWidth="2.4" strokeLinejoin="round" />
          </svg>
          <span
            style={{
              fontFamily: "var(--disp)",
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: "-.02em",
            }}
          >
            Shelf Merch
          </span>
        </div>
        <div className="spacer" />
        <div className="topbar-right">
          <Link to="/app/wallets" className="topbar-wallet" aria-label="Wallet balance">
            <span className="topbar-wallet-icon">
              <img src={walletIconImg} alt="" className="topbar-wallet-img" aria-hidden="true" />
            </span>
            <span className="topbar-wallet-copy">
              <span className="k">Wallet balance</span>
              <span className="v">
                {walletBalance}
                <TopbarChevron />
              </span>
            </span>
          </Link>
          <Link to="/app/settings" className="topbar-user" aria-label="Account menu">
            <span className="topbar-user-avatar">{initialsOf(userName)}</span>
            <span className="topbar-user-copy">
              <span className="topbar-user-name">{truncTopbarName(userName)}</span>
              <span className="topbar-user-sub">{account.toLowerCase()}</span>
            </span>
            <TopbarChevron />
          </Link>
        </div>
      </header>

      <div className="body">
        <CollapsibleSidebar />

        <main className="main scroll">
          <div className="wrap fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster position="bottom-center" richColors />
    </div>
  );
}
