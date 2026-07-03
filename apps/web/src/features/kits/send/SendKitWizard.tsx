import { useMemo, useReducer, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { LoadingState } from "@/components/LoadingState";
import { inr } from "@/components/platform/platform-ui";
import { useWorkspace, useInvalidateWorkspace } from "@/hooks/useWorkspace";
import { formatWalletAmount } from "@/lib/walletFormat";
import type { UiContact, UiProduct } from "@/services/mappers";
import { entityIdForWallet, spendableForWallet } from "@/services/workspace-api";
import { WizardChrome } from "@/features/swag/wizard/WizardChrome";
import { RecipientPicker } from "@/features/send/RecipientPicker";
import { RecipientExperience } from "@/features/send/RecipientExperience";
import { PaymentPanel } from "@/features/send/PaymentPanel";
import { kitSendTotals } from "@/features/send/money";
import { toSchedulePayload } from "@/features/send/types";
import { kitPickedIndices } from "../wizard/kitDraft";
import { useLaunchKitCampaign } from "../mutations";
import { initialSendKitDraft, sendKitReducer } from "./sendDraft";

const STEPS = ["Recipients", "Experience", "Checkout"];

function missingAddress(contacts: UiContact[], selected: string[]): UiContact[] {
  return contacts.filter(
    (c) => selected.includes(c.id) && (!c.address || !c.city || !c.state || !c.pincode),
  );
}

export function SendKitWizard() {
  const navigate = useNavigate();
  const { id } = useParams({ from: "/app/kits/$id/send" });
  const { data: workspace, isLoading } = useWorkspace();
  const refreshWorkspace = useInvalidateWorkspace();
  const launch = useLaunchKitCampaign();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [sending, setSending] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState("");

  const catalog: UiProduct[] = useMemo(() => workspace?.catalogProducts ?? [], [workspace]);
  const contacts: UiContact[] = useMemo(() => workspace?.contacts ?? [], [workspace]);
  const kit = workspace?.kits.find((k) => k.id === id);

  const initial = useMemo(() => {
    const picked = kit ? kitPickedIndices(kit, catalog) : [];
    const packaging = kit?.packaging === "none" ? "none" : "box";
    const firstRecips = contacts.slice(0, 2).map((c) => c.id);
    return initialSendKitDraft(picked, packaging, firstRecips, workspace?.account ?? "Shelf Merch");
  }, [kit, catalog, contacts, workspace?.account]);

  const [draft, dispatch] = useReducer(sendKitReducer, initial);

  if (isLoading && !workspace) {
    return <LoadingState message="Loading kit…" fullScreen={false} />;
  }
  if (!kit) {
    return (
      <div className="card" style={{ padding: 16 }}>
        Kit not found.{" "}
        <button type="button" className="lnk" onClick={() => navigate({ to: "/app/kits" })}>
          Back to kits
        </button>
      </div>
    );
  }
  if (sending || launch.isPending) {
    return <LoadingState message="Placing order…" fullScreen={false} />;
  }

  const wallet = workspace?.wallets.find((w) => w.id === selectedWalletId) ?? workspace?.wallets[0];
  const totals = kitSendTotals(draft.selRecips.length, draft.pkg);
  const surpriseMissing =
    draft.mode === "surprise" ? missingAddress(contacts, draft.selRecips) : [];

  function exit() {
    navigate({ to: "/app/kits" });
  }

  function next() {
    if (step === 0) {
      if (!draft.selRecips.length) {
        toast.error("Select at least one recipient");
        return;
      }
      if (draft.mode === "surprise" && surpriseMissing.length) {
        toast.error("Complete the shipping address for all surprise recipients");
        return;
      }
      if (draft.mode === "single") {
        const l = draft.singleLocation;
        if (!l.name || !l.email.includes("@") || !l.line1 || !l.city || !l.state || !l.pincode) {
          toast.error("Enter the location contact, email, and complete shipping address");
          return;
        }
      }
    }
    setStep((s) => Math.min(s + 1, 2) as 0 | 1 | 2);
  }

  async function payAndSend() {
    const walletId = selectedWalletId || workspace?.wallets[0]?.id;
    const entityId = walletId && workspace ? entityIdForWallet(workspace, walletId) : undefined;
    if (!entityId) {
      toast.error("No budget department found for this wallet — allocate funds first");
      return;
    }
    if (!draft.selRecips.length) {
      toast.error("Select at least one recipient");
      return;
    }
    const paymentTotal = Math.round(totals.total);
    if (draft.pay === "wallet") {
      const available =
        walletId && workspace ? spendableForWallet(workspace, walletId) : 0;
      const payWallet = walletId ? workspace?.wallets.find((w) => w.id === walletId) : undefined;
      if (available < paymentTotal) {
        toast.error(
          `Insufficient wallet balance — ${formatWalletAmount(available, payWallet?.cur)} available`,
        );
        return;
      }
    }
    setSending(true);
    try {
      await launch.mutateAsync({
        entityId: String(entityId),
        kitId: String(kit!.id),
        name: kit!.name,
        totalBudget: paymentTotal,
        fulfillmentMode:
          draft.mode === "surprise" ? "surprise" : draft.mode === "single" ? "single" : "redeem",
        singleLocation: draft.mode === "single" ? draft.singleLocation : undefined,
        message: { from: draft.from, body: draft.msg },
        schedule: toSchedulePayload(draft.when, draft.schedule),
        contactIds: draft.selRecips,
        contacts: contacts.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
        })),
      });
      await refreshWorkspace();
      toast.success(`Order placed for ${draft.selRecips.length} recipients! 📦`);
      navigate({ to: "/app/orders" });
    } catch (err) {
      setSending(false);
      toast.error(err instanceof Error ? err.message : "Failed to send kit");
    }
  }

  const footer = (
    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
      {step > 0 ? (
        <button
          type="button"
          className="lnk"
          style={{ background: "none", border: "none", cursor: "pointer" }}
          onClick={() => setStep((s) => (s - 1) as 0 | 1 | 2)}
        >
          Back
        </button>
      ) : (
        <span />
      )}
      {step < 2 ? (
        <button type="button" className="btn btn-dark" onClick={next}>
          Next
        </button>
      ) : (
        <span />
      )}
    </div>
  );

  return (
    <WizardChrome
      title="Send Items"
      steps={STEPS}
      activeIndex={step}
      onExit={exit}
      exitLabel="Cancel"
      footer={footer}
    >
      {step === 0 && (
        <>
          <RecipientPicker
            title="Who's receiving this?"
            subtitle="Choose how recipients get their items, then pick people."
            contacts={contacts}
            selected={draft.selRecips}
            onToggle={(rid) => dispatch({ type: "toggleRecip", id: rid })}
            onDeselectAll={() => dispatch({ type: "deselectRecips" })}
            showModes
            mode={draft.mode}
            onMode={(mode) => dispatch({ type: "setMode", mode })}
            singleLocation={draft.singleLocation}
            onSingleLocationChange={(key, value) => dispatch({ type: "setSingleLoc", key, value })}
          />
          {draft.mode === "surprise" && surpriseMissing.length > 0 && (
            <div className="banner" style={{ marginTop: 14 }}>
              <b>{surpriseMissing.length} recipient(s) missing a shipping address.</b> Surprise
              sends need addresses up front. Add them on the Contacts page before continuing.
            </div>
          )}
        </>
      )}

      {step === 1 && (
        <>
          <RecipientExperience
            shopName={workspace?.shops[0]?.name}
            mode={draft.mode}
            itemCount={draft.picked.length}
            from={draft.from}
            message={draft.msg}
            onFrom={(from) => dispatch({ type: "setFrom", from })}
            onMessage={(msg) => dispatch({ type: "setMsg", msg })}
            when={draft.when}
            onWhen={(when) => dispatch({ type: "setWhen", when })}
            schedule={draft.schedule}
            onSchedule={(key, value) => dispatch({ type: "setSchedule", key, value })}
            preview={draft.preview}
            onPreview={(preview) => dispatch({ type: "setPreview", preview })}
            extraLeft={
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 15, marginBottom: 6 }}>Printed card note</h3>
                <p className="muted" style={{ fontSize: 12.5, marginBottom: 10 }}>
                  Printed on a card tucked inside every kit.
                </p>
                <textarea
                  className="inp"
                  rows={3}
                  value={draft.note}
                  onChange={(e) => dispatch({ type: "setNote", note: e.target.value })}
                />
                <div
                  className="card"
                  style={{ padding: 14, background: "var(--surface-2)", marginTop: 12 }}
                >
                  <div
                    className="mut3"
                    style={{
                      fontSize: 10,
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    Card preview
                  </div>
                  <div style={{ fontFamily: "var(--disp)", fontStyle: "italic", fontSize: 14 }}>
                    {draft.note}
                  </div>
                  <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                    The {workspace?.account} team
                  </div>
                </div>
              </div>
            }
          />
        </>
      )}

      {step === 2 && (
        <>
          <h1 style={{ fontSize: 24, marginBottom: 16 }}>Checkout</h1>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <PaymentPanel
              wallet={wallet}
              wallets={workspace?.wallets ?? []}
              selected={draft.pay}
              onSelect={(pay) => dispatch({ type: "setPay", pay })}
              selectedWalletId={selectedWalletId || workspace?.wallets[0]?.id}
              onWalletSelect={setSelectedWalletId}
              walletAvailable={(w) =>
                workspace ? spendableForWallet(workspace, w.id) : 0
              }
            />
            <div className="card" style={{ padding: 22, height: "fit-content" }}>
              <h3 style={{ fontSize: 18, marginBottom: 12 }}>Order summary</h3>
              <SumRow k="Kit" v={kit.name} />
              <SumRow k="Items per recipient" v={String(draft.picked.length)} />
              <SumRow k="Recipients" v={String(totals.qty)} />
              <SumRow k="Items subtotal" v={inr(totals.sub)} />
              <SumRow k="Packaging" v={totals.pkgCost ? inr(totals.pkgCost) : "Free"} />
              <SumRow k="Service fee (12%)" v={inr(totals.fee)} />
              <SumRow k="Shipping" v={inr(totals.ship)} />
              <SumRow k="Estimated GST (18%)" v={inr(totals.tax)} />
              <div className="divider" />
              <div
                className="row"
                style={{ justifyContent: "space-between", alignItems: "center" }}
              >
                <b style={{ fontSize: 18 }}>You pay</b>
                <b className="num" style={{ fontSize: 22, fontFamily: "var(--disp)" }}>
                  {inr(totals.total)}
                </b>
              </div>
              <button
                type="button"
                className="btn btn-brand btn-block btn-lg"
                style={{ marginTop: 14 }}
                onClick={payAndSend}
              >
                Pay &amp; send
              </button>
            </div>
          </div>
        </>
      )}
    </WizardChrome>
  );
}

function SumRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", padding: "7px 0" }}>
      <span className="muted" style={{ fontSize: 13 }}>
        {k}
      </span>
      <span className="num" style={{ fontWeight: 600, fontSize: 13 }}>
        {v}
      </span>
    </div>
  );
}
