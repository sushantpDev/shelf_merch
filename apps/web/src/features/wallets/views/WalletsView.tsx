import { LoadingState } from "@/components/LoadingState";
import { EntityManagerDashboard } from "../components/EntityManagerDashboard";
import { OrgDashboard } from "../components/OrgDashboard";
import { OrgDoneScreen } from "../components/OrgDoneScreen";
import { OrgWizard } from "../components/OrgWizard";
import type { WalletsScreen } from "../controllers/useWalletsController";

/** Wallets screen: renders the dashboard / wizard / done / entity-manager view. */
export function WalletsView(screen: WalletsScreen) {
  switch (screen.kind) {
    case "loading":
      return <LoadingState message="Loading wallets…" fullScreen={false} />;
    case "error":
      return (
        <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
          {screen.message}
        </div>
      );
    case "done":
      return (
        <OrgDoneScreen
          account={screen.account}
          state={screen.state}
          onGoToDashboard={screen.onGoToDashboard}
        />
      );
    case "wizard":
      return (
        <OrgWizard
          account={screen.account}
          state={screen.state}
          dispatch={screen.dispatch}
          onExit={screen.onExit}
          onFinished={screen.onFinished}
        />
      );
    case "entityManager":
      return <EntityManagerDashboard account={screen.account} workspace={screen.workspace} />;
    case "dashboard":
      return (
        <OrgDashboard
          account={screen.account}
          org={screen.org}
          hasWallets={screen.hasWallets}
          onStart={screen.onStart}
          onAllocate={screen.onAllocate}
          openAddFundsOnMount={screen.openAddFundsOnMount}
        />
      );
  }
}
