import { useReducer, useState } from "react";
import { LoadingState } from "@/components/LoadingState";
import { useWorkspace } from "@/hooks/useWorkspace";
import { seedWizard, wizardReducer } from "./reducer";
import type { WizardState } from "./types";
import { EntityManagerDashboard } from "./components/EntityManagerDashboard";
import { OrgDashboard } from "./components/OrgDashboard";
import { OrgDoneScreen } from "./components/OrgDoneScreen";
import { OrgWizard } from "./components/OrgWizard";

const EMPTY_WIZARD: WizardState = {
  step: 1,
  done: false,
  wallet: {
    name: "",
    amount: 0,
    start: "",
    end: "",
    funding: "upload",
    docType: "Purchase Order",
    docNumber: "",
    uploaded: false,
    pay: "card",
  },
  departments: [],
  seq: 1,
  colorIdx: 0,
  sentInvites: [],
};

export function WalletsPage() {
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const [inWizard, setInWizard] = useState(false);
  const [wizard, dispatch] = useReducer(wizardReducer, EMPTY_WIZARD);

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

  const { account, org } = workspace;
  const role = workspace.userPatch.role;

  function startWizard(step: number) {
    dispatch(seedWizard(org, step));
    setInWizard(true);
  }

  // Department managers only ever see their own budget.
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
        active={org.active}
        state={wizard}
        dispatch={dispatch}
        onExit={() => setInWizard(false)}
        onFinished={() => {
          /* keep the wizard mounted so the done screen can render */
        }}
      />
    );
  }

  return (
    <OrgDashboard
      account={account}
      org={org}
      hasWallets={workspace.wallets.length > 0}
      onStart={() => startWizard(1)}
      onEdit={startWizard}
    />
  );
}
