import { useReducer, useState } from "react";
import { LoadingState } from "@/components/LoadingState";
import { useWorkspace } from "@/hooks/useWorkspace";
import { orgForWallet } from "@/services/workspace-api";
import { Route } from "@/routes/app.wallets";
import { seedAllocateWizard, seedNewWizard, wizardReducer } from "./reducer";
import { EntityManagerDashboard } from "./components/EntityManagerDashboard";
import { OrgDashboard } from "./components/OrgDashboard";
import { OrgDoneScreen } from "./components/OrgDoneScreen";
import { OrgWizard } from "./components/OrgWizard";

export function WalletsPage() {
  const { wallet: walletId, addFunds } = Route.useSearch();
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const [inWizard, setInWizard] = useState(false);
  const [wizard, dispatch] = useReducer(wizardReducer, undefined, seedNewWizard);

  if (isLoading && !workspace) {
    return <LoadingState message="Loading wallets…" fullScreen={false} />;
  }

  if (isError || !workspace) {
    return (
      <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
        {error instanceof Error ? error.message : "Could not load wallets"}
      </div>
    );
  }

  const { account } = workspace;
  const org = orgForWallet(workspace, walletId);
  const role = workspace.userPatch.role;

  function startNewWallet() {
    dispatch(seedNewWizard());
    setInWizard(true);
  }

  function startAllocateFunds(step = 2) {
    dispatch(seedAllocateWizard(org, step));
    setInWizard(true);
  }

  if (role === "entity_manager") {
    return (
      <EntityManagerDashboard
        account={account}
        org={org}
        primaryEntityId={workspace.primaryEntityId}
      />
    );
  }

  if (inWizard) {
    if (wizard.done) {
      return (
        <OrgDoneScreen
          account={account}
          state={wizard}
          onGoToDashboard={() => setInWizard(false)}
        />
      );
    }

    return (
      <OrgWizard
        account={account}
        state={wizard}
        dispatch={dispatch}
        onExit={() => setInWizard(false)}
        onFinished={() => {
          /* keep wizard mounted so the done screen can render */
        }}
      />
    );
  }

  return (
    <OrgDashboard
      account={account}
      org={org}
      hasWallets={workspace.wallets.length > 0}
      onStart={startNewWallet}
      onAllocate={startAllocateFunds}
      openAddFundsOnMount={addFunds === "1"}
    />
  );
}
