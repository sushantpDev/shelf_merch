import { useEffect } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";
import { CollapsibleSidebar } from "@/components/tenant/CollapsibleSidebar";
import { UserMenu } from "@/components/tenant/UserMenu";
import { WalletBalanceMenu } from "@/components/tenant/WalletBalanceMenu";
import { getStoredUser, isAuthenticated } from "@/services/api-bridge";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { WorkspaceSnapshot } from "@/services/workspace-api";
import "@/styles/shelf-merch.css";

// The workspace navigation now lives in <CollapsibleSidebar/>; this layout only
// renders the topbar + sidebar shell.

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
  const totalUnalloc = workspace.wallets.reduce(
    (sum, w) => sum + Math.max(0, w.unalloc ?? w.balance ?? 0),
    0,
  );
  return `₹${Math.round(totalUnalloc).toLocaleString("en-IN")}`;
}

export default function TenantLayout() {
  const user = getStoredUser();
  const { data: workspace } = useWorkspace();
  const routerState = useRouterState();
  const walletSearch =
    routerState.location.pathname === "/app/wallets"
      ? (routerState.location.search as { wallet?: string })
      : undefined;
  const currentWalletId = walletSearch?.wallet || workspace?.primaryWalletId;

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = "/login";
    }
  }, []);

  if (!isAuthenticated()) {
    return null;
  }

  const account = workspace?.account ?? "Workspace";
  const userName = workspace?.userPatch?.name ?? user?.name ?? "User";
  const userEmail = workspace?.userPatch?.email ?? user?.email ?? "";
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
          <WalletBalanceMenu
            wallets={workspace?.wallets ?? []}
            totalLabel={walletBalance}
            currentWalletId={currentWalletId}
          />
          <UserMenu
            userName={userName}
            userEmail={userEmail}
            workspaceName={account}
            workspaceLogoUrl={workspace?.logoUrl ?? ""}
            initials={initialsOf(userName)}
            truncName={truncTopbarName(userName)}
          />
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
    </div>
  );
}
