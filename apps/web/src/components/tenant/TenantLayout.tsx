import { useEffect } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router";
import { CollapsibleSidebar } from "@/components/tenant/CollapsibleSidebar";
import { UserMenu } from "@/components/tenant/UserMenu";
import { WalletBalanceMenu } from "@/components/tenant/WalletBalanceMenu";
import { ShelfMerchLogo } from "@/components/brand/ShelfMerchLogo";
import { getStoredUser, isAuthenticated } from "@/services/api-bridge";
import { useWorkspace } from "@/hooks/useWorkspace";
import { formatWalletAmount, formatWalletsTotal } from "@/lib/walletFormat";
import {
  entityManagerBudgetRemaining,
  entityManagerDepartments,
  spendableForWallet,
  type WorkspaceSnapshot,
} from "@/services/workspace-api";
import { normalizeMongoId } from "@/lib/mongoId";

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
            .map((d) => normalizeMongoId(d.walletId))
            .filter(Boolean),
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
          <ShelfMerchLogo href="/app" height={32} />
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
