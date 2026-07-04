import { useMemo, useReducer, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { LoadingState } from "@/components/LoadingState";
import { inr } from "@/components/platform/platform-ui";
import { useWorkspace, useInvalidateWorkspace } from "@/hooks/useWorkspace";
import { formatWalletAmount } from "@/lib/walletFormat";
import type { UiContact } from "@/services/mappers";
import { entityIdForWallet, spendableForWallet } from "@/services/workspace-api";
import { WizardChrome } from "@/features/swag/wizard/WizardChrome";
import { RecipientPicker } from "@/features/send/RecipientPicker";
import { RecipientExperience } from "@/features/send/RecipientExperience";
import { PaymentPanel } from "@/features/send/PaymentPanel";
import { POINT_VALUE, pointsSendTotals } from "@/features/send/money";
import { useLaunchPointsCampaign } from "../mutations";
import { initialSendPointsDraft, sendPointsReducer } from "./pointsDraft";

const STEPS = ["Budget", "Recipients", "Message", "Checkout"];

export function SendPointsWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const search = { shop: searchParams.get("shop") ?? undefined };
  const { data: workspace, isLoading } = useWorkspace();
  const refreshWorkspace = useInvalidateWorkspace();
  const launch = useLaunchPointsCampaign();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [sending, setSending] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState("");

  const contacts: UiContact[] = useMemo(() => workspace?.contacts ?? [], [workspace]);
  const shops = workspace?.shops ?? [];
  const shopId = search.shop || shops[0]?.id;
  const shop = shops.find((s) => s.id === shopId);

  const initial = useMemo(
    () =>
      initialSendPointsDraft(
        contacts.slice(0, 2).map((c) => c.id),
        workspace?.account ?? "Shelf Merch",
      ),
    [contacts, workspace?.account],
  );
  const [draft, dispatch] = useReducer(sendPointsReducer, initial);

  if (isLoading && !workspace) {
    return <LoadingState message="Loading…" fullScreen={false} />;
  }
  if (sending || launch.isPending) {
    return <LoadingState message="Sending points…" fullScreen={false} />;
  }

  const totals = pointsSendTotals(draft.ppr, draft.recips);
  const wallet = workspace?.wallets.find((w) => w.id === selectedWalletId) ?? workspace?.wallets[0];

  function exit() {
    navigate("/app/campaigns");
  }

  function next() {
    setStep((s) => Math.min(s + 1, 3) as 0 | 1 | 2 | 3);
  }

  async function payNow() {
    const walletId = selectedWalletId || workspace?.wallets[0]?.id;
    const entityId = walletId && workspace ? entityIdForWallet(workspace, walletId) : undefined;
    if (!entityId) {
      toast.error("No budget department found for this wallet — allocate funds first");
      return;
    }
    if (!shopId) {
      toast.error("Select a shop for this campaign");
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
        shopId: String(shopId),
        name: draft.orderName || "Points campaign",
        creditsPerRecipient: draft.ppr,
        totalBudget: paymentTotal,
        message: { from: draft.from, body: draft.msg },
        contactIds: draft.selRecips,
        contacts: contacts.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
        })),
      });
      await refreshWorkspace();
      toast.success(`Points sent to ${draft.selRecips.length} recipients! 🎉`);
      navigate(`/app/shops/${String(shopId)}`);
    } catch (err) {
      setSending(false);
      toast.error(err instanceof Error ? err.message : "Failed to launch campaign");
    }
  }

  const footer = (
    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
      <button
        type="button"
        className="lnk"
        style={{ background: "none", border: "none", cursor: "pointer" }}
        onClick={() => (step === 0 ? exit() : setStep((s) => (s - 1) as 0 | 1 | 2 | 3))}
      >
        {step === 0 ? "Cancel" : "Back"}
      </button>
      {step < 3 ? (
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
      title="Send Points"
      steps={STEPS}
      activeIndex={step}
      onExit={exit}
      exitLabel="Cancel"
      footer={footer}
    >
      {step === 0 && (
        <div className="card" style={{ padding: 24, maxWidth: 880, width: "100%", margin: "10px auto 0" }}>
          <div
            className="row"
            style={{ justifyContent: "space-between", alignItems: "flex-start" }}
          >
            <div>
              <h1 style={{ fontSize: 24 }}>Send Points</h1>
              <p className="muted">Points let recipients redeem items from your shop.</p>
            </div>
            <span className="tag tag-ready">₹2 = 1 Pt</span>
          </div>
          <div className="divider" />
          <div className="row" style={{ gap: 20 }}>
            <div className="field" style={{ flex: 1 }}>
              <label className="lbl">Name your order (internal)</label>
              <input
                className="inp"
                value={draft.orderName}
                onChange={(e) => dispatch({ type: "setOrderName", orderName: e.target.value })}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label className="lbl">Number of recipients</label>
              <input
                className="inp num"
                value={draft.recips}
                onChange={(e) =>
                  dispatch({ type: "setRecips", recips: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <label className="lbl">Budget per recipient (₹2 = 1 Pt)</label>
          <div className="row" style={{ alignItems: "center", gap: 14 }}>
            <div className="inp-wrap" style={{ flex: 1 }}>
              <input
                className="inp num"
                value={draft.ppr}
                onChange={(e) => dispatch({ type: "setPpr", ppr: Number(e.target.value) || 0 })}
              />
              <span className="inp-suffix">INR</span>
            </div>
            <div style={{ color: "var(--ink-3)" }}>
              <ArrowLeftRight size={18} />
            </div>
            <div className="inp-wrap" style={{ flex: 1 }}>
              <input
                className="inp num"
                value={(draft.ppr / POINT_VALUE).toFixed(2)}
                readOnly
                style={{ background: "var(--surface-2)" }}
              />
              <span className="inp-suffix">POINTS</span>
            </div>
          </div>
          <p className="mut3" style={{ fontSize: 12, marginTop: 8 }}>
            No minimum budget. Shipping included.
          </p>
        </div>
      )}

      {step === 1 && (
        <RecipientPicker
          title="Add recipients"
          subtitle="Don't have all emails? You can add recipients later from the shop dashboard."
          contacts={contacts}
          selected={draft.selRecips}
          onToggle={(id) => dispatch({ type: "toggleRecip", id })}
          onDeselectAll={() => dispatch({ type: "deselectRecips" })}
        />
      )}

      {step === 2 && (
        <RecipientExperience
          kind="points"
          shopName={shop?.name}
          pointsAmount={Math.round(draft.ppr / POINT_VALUE)}
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
        />
      )}

      {step === 3 && (
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
              <div
                className="row"
                style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}
              >
                <h3 style={{ fontSize: 18 }}>Order summary</h3>
                <span className="tag tag-ready">₹2 = 1 Pt</span>
              </div>
              <SumRow k="No. of recipients" v={String(draft.recips)} />
              <SumRow k="Points per recipient" v={`${totals.pointsPerRecipient.toFixed(2)} Pts`} />
              <SumRow
                k="Total points purchased"
                v={`${totals.totalPoints.toLocaleString("en-IN")} Pts (${inr(totals.sub)})`}
              />
              <SumRow k="Service fee (15%)" v={inr(totals.fee)} />
              <SumRow k="Estimated GST (18%)" v={inr(totals.tax)} />
              <button
                type="button"
                className="lnk"
                style={{
                  fontSize: 12.5,
                  margin: "8px 0",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "block",
                }}
                onClick={() => toast("Promo applied")}
              >
                Apply promo code
              </button>
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
                onClick={payNow}
              >
                Pay now
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
