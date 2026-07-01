import { useState, type Dispatch } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingState } from "@/components/LoadingState";
import type { WizardAction } from "../reducer";
import {
  ALLOC_STEP_MAX,
  ALLOC_STEP_MIN,
  ALLOC_STEPS,
  ORG_STEPS,
  selectedDepartments,
  totalAlloc,
  wizardCommittedAllocations,
  type WizardState,
} from "../types";
import { useCreateWallet, useSyncOrgWizard } from "../hooks";
import { Step1Wallet } from "./steps/Step1Wallet";
import { Step2Departments } from "./steps/Step2Departments";
import { Step3Allocate } from "./steps/Step3Allocate";
import { Step4Managers } from "./steps/Step4Managers";
import { Step5Review } from "./steps/Step5Review";

export function OrgWizard({
  account,
  state,
  dispatch,
  onExit,
  onFinished,
}: {
  account: string;
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  onExit: () => void;
  onFinished: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const createWallet = useCreateWallet();
  const sync = useSyncOrgWizard();
  const isWalletFlow = state.flow === "wallet";
  const busy = createWallet.isPending || sync.isPending;
  const n = state.step;
  const alloc = totalAlloc(state.departments);
  const walletAlloc = wizardCommittedAllocations(state.departments, state.mode);
  const over = !isWalletFlow && n === 3 && walletAlloc > state.wallet.amount;

  function validateWalletStep(): boolean {
    const w = state.wallet;
    if (!w.name.trim()) {
      toast.error("Enter a wallet name");
      return false;
    }
    if (w.amount <= 0) {
      toast.error("Enter a budget amount greater than zero");
      return false;
    }
    if (w.funding === "upload" && !w.uploaded && !w.uploadFile) {
      toast.error("Upload your PO or agreement document");
      return false;
    }
    return true;
  }

  function handleNext() {
    if (isWalletFlow) {
      if (!validateWalletStep()) return;
      setConfirmOpen(true);
      return;
    }

    if (n === 2 && selectedDepartments(state.departments).length === 0) {
      toast.error("Select at least one department to continue");
      return;
    }
    if (n === 3 && walletAlloc > state.wallet.amount) {
      toast.error("Reduce allocations to continue");
      return;
    }
    if (n === ALLOC_STEP_MAX) {
      if (alloc <= 0) {
        toast.error("Allocate budget to at least one department before finishing");
        return;
      }
      setConfirmOpen(true);
      return;
    }
    dispatch({ type: "next" });
  }

  async function handleFinish() {
    setConfirmOpen(false);
    try {
      if (isWalletFlow) {
        const result = await createWallet.mutateAsync(state);
        dispatch({ type: "finished", walletId: result.walletId, invites: [] });
        toast.success("Wallet submitted — finance will review your PO");
        onFinished();
        return;
      }

      const result = await sync.mutateAsync(state);
      dispatch({ type: "finished", walletId: result.walletId, invites: result.invites });
      const withLinks = result.invites.filter((i) => i.inviteToken).length;
      toast.success(
        withLinks
          ? `Allocations saved — ${withLinks} invite link(s) shown below`
          : "Budget allocation saved to your workspace",
      );
      onFinished();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }

  if (busy) {
    return (
      <LoadingState
        message={isWalletFlow ? "Creating wallet…" : "Saving allocation setup…"}
        fullScreen={false}
      />
    );
  }

  const stepLabels = isWalletFlow ? [ORG_STEPS[0]] : [...ALLOC_STEPS];
  const stepNumbers = isWalletFlow ? [1] : [2, 3, 4, 5];
  const displayStepIndex = isWalletFlow ? 0 : n - ALLOC_STEP_MIN;
  const displayStepTotal = stepLabels.length;
  const displayStepLabel = stepLabels[displayStepIndex] ?? "";

  return (
    <>
      <div className="page-h">
        <div>
          <button
            type="button"
            className="lnk"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
            onClick={onExit}
          >
            <ArrowLeft size={15} /> Back to wallet dashboard
          </button>
          <h1>{isWalletFlow ? "Create wallet" : "Allocate funds"}</h1>
          <div className="sub">
            {isWalletFlow
              ? `${account} · set up your merchandise budget and submit PO for finance review.`
              : `${account} · split your wallet balance across departments and assign managers.`}
          </div>
        </div>
      </div>

      <div className="org-stepper">
        {stepLabels.map((label, i) => {
          const s = stepNumbers[i];
          const cls = s < n ? "done" : s === n ? "active" : "";
          return (
            <div key={label} className={`org-step ${cls}`}>
              <button
                type="button"
                className="sbtn"
                onClick={() => !isWalletFlow && dispatch({ type: "goto", step: s })}
                disabled={isWalletFlow}
              >
                <div className="snum">{s < n ? "✓" : i + 1}</div>
                <div className="smeta">
                  <span className="seye">Step {i + 1}</span>
                  <span className="slabel">{label}</span>
                </div>
              </button>
              {i < stepLabels.length - 1 && <div className="sline" />}
            </div>
          );
        })}
      </div>

      {isWalletFlow && n === 1 && <Step1Wallet state={state} dispatch={dispatch} />}
      {!isWalletFlow && n === 2 && <Step2Departments state={state} dispatch={dispatch} />}
      {!isWalletFlow && n === 3 && <Step3Allocate state={state} dispatch={dispatch} />}
      {!isWalletFlow && n === 4 && <Step4Managers state={state} dispatch={dispatch} />}
      {!isWalletFlow && n === 5 && <Step5Review state={state} dispatch={dispatch} account={account} />}

      <div className="org-foot">
        <span style={{ visibility: isWalletFlow || n === ALLOC_STEP_MIN ? "hidden" : undefined }}>
          <button
            type="button"
            className="lnk"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
            onClick={() => dispatch({ type: "back" })}
          >
            <ArrowLeft size={15} /> Back
          </button>
        </span>
        <div className="note">
          Step {displayStepIndex + 1} of {displayStepTotal} · <b>{displayStepLabel}</b>
        </div>
        <button
          type="button"
          className="btn btn-brand"
          id="org-next"
          disabled={over}
          onClick={handleNext}
        >
          {isWalletFlow
            ? "Submit for review"
            : n === ALLOC_STEP_MAX
              ? "Finish allocation"
              : "Continue"}
          <Send size={15} />
        </button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm-modal">
          <div className="modal-pad">
            <DialogHeader>
              <DialogTitle style={{ fontSize: 22, fontFamily: "var(--disp)" }}>
                {isWalletFlow ? "Submit wallet for review?" : "Finish allocation?"}
              </DialogTitle>
              <DialogDescription className="muted" style={{ fontSize: 13.5, margin: "6px 0 20px" }}>
                {isWalletFlow ? (
                  <>
                    This creates the <b>{state.wallet.name}</b> wallet and sends your PO to platform
                    finance. Your balance will appear after approval — then you can allocate funds
                    to departments.
                  </>
                ) : (
                  <>
                    This saves department allocations and sends manager invitations for{" "}
                    <b>{state.wallet.name}</b>. You can edit everything afterward.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="row" style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => setConfirmOpen(false)}
              >
                Not yet
              </button>
              <button type="button" className="btn btn-brand btn-block" onClick={handleFinish}>
                {isWalletFlow ? "Submit for review" : "Finish allocation"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
