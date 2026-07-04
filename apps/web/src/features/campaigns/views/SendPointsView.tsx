import { ArrowLeftRight, CircleHelp } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { inr } from "@/components/platform/platform-ui";
import { WizardChrome } from "@/features/swag/wizard/WizardChrome";
import { RecipientPicker } from "@/features/send/RecipientPicker";
import { RecipientExperience } from "@/features/send/RecipientExperience";
import { PaymentPanel } from "@/features/send/PaymentPanel";
import { POINT_VALUE } from "@/features/send/money";
import { SEND_POINTS_PLACEHOLDERS } from "../pointsDraft";
import type { SendPointsVm } from "../controllers/useSendPointsController";

const STEPS = ["Budget", "Recipients", "Message", "Checkout"];

/** Pure wizard shell for the send-points flow; all state and actions come from the controller. */
export function SendPointsView({
  isLoading,
  isSending,
  isSaving,
  step,
  draft,
  dispatch,
  totals,
  contacts,
  shop,
  shopCurrencyLabel,
  stadiumPointsAllowed,
  wallet,
  wallets,
  selectedWalletId,
  onWalletSelect,
  walletAvailable,
  onExit,
  onNext,
  onBack,
  onPayNow,
  onSaveAndExit,
  onApplyPromo,
}: SendPointsVm) {
  if (isLoading) {
    return <LoadingState message="Loading…" fullScreen={false} />;
  }
  if (isSending) {
    return <LoadingState message="Sending points…" fullScreen={false} />;
  }

  const footer = (
    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
      <button
        type="button"
        className="lnk"
        style={{ background: "none", border: "none", cursor: "pointer" }}
        disabled={isSaving}
        onClick={() => (step === 0 ? onExit() : onBack())}
      >
        {step === 0 ? "Cancel" : "Back"}
      </button>
      {step < 3 ? (
        <button type="button" className="btn btn-brand" onClick={onNext}>
          Next
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-soft"
          disabled={isSaving}
          onClick={() => void onSaveAndExit()}
        >
          {isSaving ? "Saving…" : "Save and exit"}
        </button>
      )}
    </div>
  );

  return (
    <WizardChrome
      title="Send Points"
      steps={STEPS}
      activeIndex={step}
      onExit={() => void onSaveAndExit()}
      exitLabel={isSaving ? "Saving…" : "Save and exit"}
      exitDisabled={isSaving}
      showExit
      footer={footer}
    >
      {step === 0 && (
        <div
          className="card"
          style={{ padding: 24, maxWidth: 880, width: "100%", margin: "10px auto 0" }}
        >
          <div
            className="row"
            style={{ justifyContent: "space-between", alignItems: "flex-start" }}
          >
            <div>
              <h1 style={{ fontSize: 24 }}>Send Points</h1>
              <p className="muted">Points let recipients redeem items from your shop.</p>
              {shop ? (
                <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                  Sending from <b>{shop.name}</b>
                </p>
              ) : null}
            </div>
            <span className="tag tag-ready">{shopCurrencyLabel}</span>
          </div>
          <div className="divider" />
          <div className="row" style={{ gap: 20 }}>
            <div className="field" style={{ flex: 1 }}>
              <label className="lbl">Name your order (internal)</label>
              <input
                className="inp"
                value={draft.orderName}
                placeholder={SEND_POINTS_PLACEHOLDERS.orderName}
                onChange={(e) => dispatch({ type: "setOrderName", orderName: e.target.value })}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label className="lbl">Number of recipients</label>
              <input
                className="inp num"
                value={draft.recips || ""}
                placeholder={SEND_POINTS_PLACEHOLDERS.recips}
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
                value={draft.ppr || ""}
                placeholder={SEND_POINTS_PLACEHOLDERS.ppr}
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
                value={draft.ppr ? (draft.ppr / POINT_VALUE).toFixed(2) : ""}
                placeholder={SEND_POINTS_PLACEHOLDERS.points}
                readOnly
                style={{ background: "var(--surface-2)" }}
              />
              <span className="inp-suffix">POINTS</span>
            </div>
          </div>
          <p className="mut3" style={{ fontSize: 12, marginTop: 8 }}>
            No minimum budget. Shipping included.
          </p>
          <div className="divider" style={{ marginTop: 18 }} />
          <div style={{ marginTop: 18 }}>
            <div
              className="lbl"
              style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}
            >
              Choose the type of currency you want to send <CircleHelp size={14} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <ScopeCard
                selected={draft.pointsScope === "stadium"}
                disabled={!stadiumPointsAllowed}
                title="Shelf Merch Points (can be used anywhere)"
                description="Recipients will be directed to this shop but can spend Shelf Merch Points anywhere. Shelf Merch Points can be forwarded and accrued. This will always show as points to your recipients, regardless of the shop currency you've set."
                disabledNote="Enable Points Conversion in shop settings to allow Shelf Merch Points."
                onClick={() => dispatch({ type: "setPointsScope", pointsScope: "stadium" })}
              />
              <ScopeCard
                selected={draft.pointsScope === "shop"}
                title="Shop Points (can only be used in this shop)"
                description={`Points will be restricted to this shop only and cannot be forwarded. Choose this option to use MagicLink, where you can allow anyone to redeem. You'll only pay for recipients you approve. This currency will always match the shop currency you've set (${shopCurrencyLabel}).`}
                onClick={() => dispatch({ type: "setPointsScope", pointsScope: "shop" })}
              />
            </div>
          </div>
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
          shopBrand={
            shop
              ? { name: shop.name, logoUrl: shop.logoUrl, bannerConfig: shop.bannerConfig }
              : undefined
          }
          pointsScope={draft.pointsScope}
          pointsAmount={Math.round(draft.ppr / POINT_VALUE)}
          from={draft.from}
          message={draft.msg}
          fromPlaceholder={SEND_POINTS_PLACEHOLDERS.from}
          messagePlaceholder={SEND_POINTS_PLACEHOLDERS.msg}
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
              wallets={wallets}
              selected={draft.pay}
              onSelect={(pay) => dispatch({ type: "setPay", pay })}
              selectedWalletId={selectedWalletId}
              onWalletSelect={onWalletSelect}
              walletAvailable={walletAvailable}
            />
            <div className="card" style={{ padding: 22, height: "fit-content" }}>
              <div
                className="row"
                style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}
              >
                <h3 style={{ fontSize: 18 }}>Order summary</h3>
                <span className="tag tag-ready">₹2 = 1 Pt</span>
              </div>
              <SumRow
                k="No. of recipients"
                v={draft.recips ? String(draft.recips) : SEND_POINTS_PLACEHOLDERS.recips}
              />
              <SumRow
                k={`${draft.pointsScope === "stadium" ? "Shelf Merch" : "Shop"} points per recipient`}
                v={`${totals.pointsPerRecipient.toFixed(2)} Pts`}
              />
              <SumRow
                k={`Total ${draft.pointsScope === "stadium" ? "Shelf Merch" : "Shop"} points purchased`}
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
                onClick={onApplyPromo}
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
                onClick={onPayNow}
              >
                Pay now
              </button>
              <button
                type="button"
                className="btn btn-soft btn-block"
                style={{ marginTop: 10 }}
                disabled={isSaving}
                onClick={() => void onSaveAndExit()}
              >
                {isSaving ? "Saving…" : "Save as draft"}
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

function ScopeCard({
  title,
  description,
  selected = false,
  disabled = false,
  disabledNote,
  onClick,
}: {
  title: string;
  description: string;
  selected?: boolean;
  disabled?: boolean;
  disabledNote?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`optcard ${selected ? "on" : ""}`}
      disabled={disabled}
      onClick={onClick}
      style={{
        alignItems: "flex-start",
        textAlign: "left",
        opacity: disabled ? 0.65 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        minHeight: 136,
      }}
    >
      <div className="rd" />
      <div>
        <h4>{title}</h4>
        <p style={{ marginTop: 6, color: "var(--ink-2)", lineHeight: 1.5 }}>{description}</p>
        {disabled && disabledNote ? (
          <p style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 12 }}>{disabledNote}</p>
        ) : null}
      </div>
    </button>
  );
}
