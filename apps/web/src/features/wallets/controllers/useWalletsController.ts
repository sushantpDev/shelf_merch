import { useReducer, useState, type Dispatch } from "react";
import { useSearchParams } from "react-router";
import { useWorkspace } from "@/hooks/useWorkspace";
import { orgForWallet, type WorkspaceSnapshot } from "@/services/workspace-api";
import { seedAllocateWizard, seedNewWizard, wizardReducer, type WizardAction } from "../reducer";
import type { OrgSnapshot, WizardState } from "../types";

export type WalletsScreen =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; account: string; state: WizardState; onGoToDashboard: () => void }
  | {
      kind: "wizard";
      account: string;
      state: WizardState;
      dispatch: Dispatch<WizardAction>;
      onExit: () => void;
      onFinished: () => void;
    }
  | { kind: "entityManager"; account: string; workspace: WorkspaceSnapshot }
  | {
      kind: "dashboard";
      account: string;
      org: OrgSnapshot;
      hasWallets: boolean;
      onStart: () => void;
      onAllocate: (step?: number) => void;
      openAddFundsOnMount: boolean;
    };

/**
 * Controller for the wallets screen. Owns the org-wizard reducer + `inWizard`
 * state and resolves which screen to render (dashboard / wizard / done /
 * entity-manager) from the workspace snapshot, role, and URL params.
 */
export function useWalletsController(): WalletsScreen {
  const [searchParams] = useSearchParams();
  const walletId = searchParams.get("wallet") ?? undefined;
  const addFunds = searchParams.get("addFunds") ?? undefined;
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const [inWizard, setInWizard] = useState(false);
  const [wizard, dispatch] = useReducer(wizardReducer, undefined, seedNewWizard);

  if (isLoading && !workspace) {
    return { kind: "loading" };
  }
  if (isError || !workspace) {
    return {
      kind: "error",
      message: error instanceof Error ? error.message : "Could not load wallets",
    };
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

  if (inWizard) {
    if (wizard.done && wizard.flow === "wallet") {
      return {
        kind: "done",
        account,
        state: wizard,
        onGoToDashboard: () => setInWizard(false),
      };
    }
    return {
      kind: "wizard",
      account,
      state: wizard,
      dispatch,
      onExit: () => setInWizard(false),
      onFinished: () => {
        /* wallet create — done screen renders via wizard.done */
      },
    };
  }

  if (role === "entity_manager" && workspace.wallets.length > 0) {
    return { kind: "entityManager", account, workspace };
  }

  return {
    kind: "dashboard",
    account,
    org,
    hasWallets: workspace.wallets.length > 0,
    onStart: startNewWallet,
    onAllocate: startAllocateFunds,
    openAddFundsOnMount: addFunds === "1",
  };
}
