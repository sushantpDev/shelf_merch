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
import { ORG_STEPS, totalAlloc, type WizardState } from "../types";
import { useSyncOrgWizard } from "../hooks";
import { Step1Wallet } from "./steps/Step1Wallet";
import { Step2Departments } from "./steps/Step2Departments";
import { Step3Allocate } from "./steps/Step3Allocate";
import { Step4Managers } from "./steps/Step4Managers";
import { Step5Review } from "./steps/Step5Review";

export function OrgWizard({
  account,
  active,
  state,
  dispatch,
  onExit,
  onFinished,
}: {
  account: string;
  active: boolean;
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  onExit: () => void;
  onFinished: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const sync = useSyncOrgWizard();
  const n = state.step;
  const alloc = totalAlloc(state.departments);
  const over = n === 3 && alloc > state.wallet.amount;

  function handleNext() {
    if (n === 3 && alloc > state.wallet.amount) {
      toast.error("Reduce allocations to continue");
      return;
    }
    if (n === 5) {
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
      const result = await sync.mutateAsync(state);
      dispatch({ type: "finished", walletId: result.walletId, invites: result.invites });
      const withLinks = result.invites.filter((i) => i.inviteToken).length;
      toast.success(
        withLinks
          ? `Wallet saved — ${withLinks} invite link(s) shown below`
          : "Wallet setup saved to your workspace",
      );
      onFinished();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save wallet setup");
    }
  }

  if (sync.isPending) {
    return <LoadingState message="Saving wallet setup…" fullScreen={false} />;
  }

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
          <h1>{active ? "Create another wallet" : "Organization setup"}</h1>
          <div className="sub">
            {account} · configure your merchandise budget, cost centers and managers.
          </div>
        </div>
      </div>

      <div className="org-stepper">
        {ORG_STEPS.map((label, i) => {
          const s = i + 1;
          const cls = s < n ? "done" : s === n ? "active" : "";
          return (
            <div key={label} className={`org-step ${cls}`}>
              <button
                type="button"
                className="sbtn"
                onClick={() => dispatch({ type: "goto", step: s })}
              >
                <div className="snum">{s < n ? "✓" : s}</div>
                <div className="smeta">
                  <span className="seye">Step {s}</span>
                  <span className="slabel">{label}</span>
                </div>
              </button>
              {s < 5 && <div className="sline" />}
            </div>
          );
        })}
      </div>

      {n === 1 && <Step1Wallet state={state} dispatch={dispatch} />}
      {n === 2 && <Step2Departments state={state} dispatch={dispatch} />}
      {n === 3 && <Step3Allocate state={state} dispatch={dispatch} />}
      {n === 4 && <Step4Managers state={state} dispatch={dispatch} />}
      {n === 5 && <Step5Review state={state} dispatch={dispatch} account={account} />}

      <div className="org-foot">
        <span style={{ visibility: n === 1 ? "hidden" : undefined }}>
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
          Step {n} of 5 · <b>{ORG_STEPS[n - 1]}</b>
        </div>
        <button
          type="button"
          className="btn btn-brand"
          id="org-next"
          disabled={over}
          onClick={handleNext}
        >
          {n === 5 ? "Finish setup" : "Continue"}
          <Send size={15} />
        </button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm-modal">
          <div className="modal-pad">
            <DialogHeader>
              <DialogTitle style={{ fontSize: 22, fontFamily: "var(--disp)" }}>
                Finish setup?
              </DialogTitle>
              <DialogDescription className="muted" style={{ fontSize: 13.5, margin: "6px 0 20px" }}>
                This activates the <b>{state.wallet.name}</b> wallet, creates all departments and
                sends manager invitations. You can still edit everything afterward.
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
                Finish setup
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
