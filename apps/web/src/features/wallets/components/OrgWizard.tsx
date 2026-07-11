import { useRef, useState, type Dispatch } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { inr } from "@/components/platform/platform-ui";
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
  allocationFromPool,
  departmentsToSync,
  isAllocateEditFlow,
  wizardCommittedAllocations,
  type WizardState,
} from "../types";
import { useCreateWallet, useSyncOrgWizard } from "../model";
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
  const submitInFlight = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const createWallet = useCreateWallet();
  const sync = useSyncOrgWizard();
  const isWalletFlow = state.flow === "wallet";
  const busy = submitting || createWallet.isPending || sync.isPending;
  const n = state.step;
  const isEditAllocate = isAllocateEditFlow(state.flow, state.mode);
  const fromPool = allocationFromPool(state.departments);
  const walletAlloc = wizardCommittedAllocations(state.departments);
  const over =
    !isWalletFlow &&
    n === 3 &&
    (isEditAllocate
      ? fromPool > (state.unallocatedAtStart ?? state.wallet.amount)
      : walletAlloc > state.wallet.amount);

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
    if (w.funding === "upload" && !w.docNumber.trim()) {
      toast.error("Enter the document number");
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

    if (n === 2 && departmentsToSync(state.departments).length === 0) {
      toast.error("Select at least one department to continue");
      return;
    }
    if (n === 3 && over) {
      toast.error("Reduce allocations to continue");
      return;
    }
    if (n === ALLOC_STEP_MAX) {
      if (walletAlloc <= 0) {
        toast.error("Allocate budget to at least one department before finishing");
        return;
      }
      setConfirmOpen(true);
      return;
    }
    dispatch({ type: "next" });
  }

  async function handleFinish() {
    if (submitInFlight.current) return;
    submitInFlight.current = true;
    setSubmitting(true);
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
          ? `Allocations saved — ${withLinks} manager invite(s) sent`
          : "Budget allocation saved",
      );
      onExit();
    } catch (err) {
      submitInFlight.current = false;
      setSubmitting(false);
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
                  {/* <span className="seye">Step {i + 1}</span> */}
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
      {!isWalletFlow && n === 5 && (
        <Step5Review state={state} dispatch={dispatch} account={account} />
      )}

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
        {/* <div className="note">
          Step {displayStepIndex + 1} of {displayStepTotal} · <b>{displayStepLabel}</b>
        </div> */}
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
        <DialogContent className="sm-modal" style={{ maxWidth: 440 }}>
          <div className="modal-pad">
            <DialogHeader>
              <DialogTitle style={{ fontSize: 20, fontFamily: "var(--disp)" }}>
                {isWalletFlow ? "Submit wallet for review?" : "Finish allocation?"}
              </DialogTitle>
              <DialogDescription className="muted" style={{ fontSize: 14, margin: "8px 0 0" }}>
                {isWalletFlow ? (
                  <>
                    Create <b>{state.wallet.name}</b> ({inr(state.wallet.amount)}) and send your PO
                    to finance for approval.
                  </>
                ) : (
                  <>
                    Save allocations for <b>{state.wallet.name}</b> ({inr(fromPool)}) and send
                    manager invites.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="row" style={{ gap: 10, marginTop: 24 }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-brand"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={handleFinish}
                disabled={submitting}
              >
                {isWalletFlow ? "Submit" : "Finish"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
