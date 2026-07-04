import { useEffect } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router";
import { CollapsibleSidebar } from "@/components/tenant/CollapsibleSidebar";
import { UserMenu } from "@/components/tenant/UserMenu";
import { WalletBalanceMenu } from "@/components/tenant/WalletBalanceMenu";
import { getStoredUser, isAuthenticated } from "@/services/api-bridge";
import { useWorkspace } from "@/hooks/useWorkspace";
import { formatWalletAmount, formatWalletsTotal } from "@/lib/walletFormat";
import {
  entityManagerBudgetRemaining,
  entityManagerDepartments,
  spendableForWallet,
  type WorkspaceSnapshot,
} from "@/services/workspace-api";
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
  if (!workspace) return formatWalletAmount(0, "INR");
  if (workspace.userPatch.role === "entity_manager") {
    return formatWalletAmount(entityManagerBudgetRemaining(workspace), "INR");
  }
  return formatWalletsTotal(workspace.wallets);
}

export default function TenantLayout() {
  const user = getStoredUser();
  const { data: workspace } = useWorkspace();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const walletParam =
    location.pathname === "/app/wallets" ? (searchParams.get("wallet") ?? undefined) : undefined;
  const currentWalletId = walletParam || workspace?.primaryWalletId;

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
  const isEntityManager = workspace?.userPatch.role === "entity_manager";
  const entityManagerWalletIds =
    isEntityManager && workspace
      ? new Set(
          entityManagerDepartments(workspace)
            .map((d) => d.walletId)
            .filter((id): id is string => Boolean(id)),
        )
      : undefined;
  const headerWallets =
    isEntityManager && entityManagerWalletIds
      ? (workspace?.wallets ?? []).filter((w) => entityManagerWalletIds.has(w.id))
      : (workspace?.wallets ?? []);
  const walletItemBalance =
    isEntityManager && workspace
      ? (w: WorkspaceSnapshot["wallets"][number]) =>
          formatWalletAmount(spendableForWallet(workspace, w.id), w.cur)
      : undefined;

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
            wallets={headerWallets}
            totalLabel={walletBalance}
            currentWalletId={currentWalletId}
            balanceCaption={isEntityManager ? "Available department budget" : "Available balance"}
            itemBalance={
              walletItemBalance
            }
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
