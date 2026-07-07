import { LoadingState } from "@/components/LoadingState";
import { inr } from "@/components/platform/platform-ui";
import { WizardChrome } from "@/features/swag/wizard/WizardChrome";
import { RecipientPicker, LocField } from "@/features/send/RecipientPicker";
import { RecipientExperience } from "@/features/send/RecipientExperience";
import { PaymentPanel } from "@/features/send/PaymentPanel";
import type { SendKitVm } from "../controllers/useSendKitController";

const STEPS = ["Choose Mode", "Recipients", "Experience", "Checkout"];

/** Send-kit wizard shell; all state and actions come from the controller. */
export function SendKitView(vm: SendKitVm) {
  const { draft, dispatch } = vm;

  if (vm.isLoading) {
    return <LoadingState message="Loading kit…" fullScreen={false} />;
  }
  if (vm.notFound || !vm.kit) {
    return (
      <div className="card" style={{ padding: 16 }}>
        Kit not found.{" "}
        <button type="button" className="lnk" onClick={vm.onExit}>
          Back to kits
        </button>
      </div>
    );
  }
  if (vm.isSending) {
    return <LoadingState message="Placing order…" fullScreen={false} />;
  }

  const { totals, kit } = vm;

  const footer = (
    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
      {vm.step > 0 ? (
        <button
          type="button"
          className="lnk"
          style={{ background: "none", border: "none", cursor: "pointer" }}
          onClick={vm.onBack}
        >
          Back
        </button>
      ) : (
        <span />
      )}
      {vm.step < 3 ? (
        <button type="button" className="btn btn-dark" onClick={vm.onNext}>
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
      activeIndex={vm.step}
      onExit={vm.onExit}
      exitLabel="Cancel"
      footer={footer}
    >
      {vm.step === 0 && (
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "10px 0" }}>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Choose Send Mode</h1>
          <p className="muted" style={{ marginBottom: 24 }}>
            Select how you would like to deliver this kit to your recipients.
          </p>
          <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <button
              type="button"
              className={`optcard ${draft.mode === "surprise" ? "on" : ""}`}
              onClick={() => dispatch({ type: "setMode", mode: "surprise" })}
              style={{ minHeight: 180, display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", cursor: "pointer", padding: 18 }}
            >
              <div className="rd" />
              <div style={{ marginTop: 12 }}>
                <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Surprise recipient</h4>
                <p className="muted" style={{ fontSize: 13, lineHeight: 1.4 }}>
                  Enter recipient details up front so gifts ship directly without requiring their input.
                </p>
              </div>
            </button>

            <button
              type="button"
              className={`optcard ${draft.mode === "single" ? "on" : ""}`}
              onClick={() => dispatch({ type: "setMode", mode: "single" })}
              style={{ minHeight: 180, display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", cursor: "pointer", padding: 18 }}
            >
              <div className="rd" />
              <div style={{ marginTop: 12 }}>
                <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Send all kits to given address</h4>
                <p className="muted" style={{ fontSize: 13, lineHeight: 1.4 }}>
                  Ship all units to one office, event venue or specific address.
                </p>
              </div>
            </button>

            <button
              type="button"
              className={`optcard ${draft.mode === "redeem" ? "on" : ""}`}
              onClick={() => dispatch({ type: "setMode", mode: "redeem" })}
              style={{ minHeight: 180, display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", cursor: "pointer", padding: 18 }}
            >
              <div className="rd" />
              <div style={{ marginTop: 12 }}>
                <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Let recipient choose the variants</h4>
                <p className="muted" style={{ fontSize: 13, lineHeight: 1.4 }}>
                  Recipients choose their own size, color & shipping address from a private link.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {vm.step === 1 && (
        <>
          {draft.mode === "single" && (
            <div className="card" style={{ padding: 20, marginBottom: 18 }}>
              <h3 style={{ fontSize: 16, marginBottom: 5 }}>Single delivery location</h3>
              <p className="muted" style={{ fontSize: 12.5, marginBottom: 16 }}>
                All selected recipients' gifts will ship together to this address. A notification will
                be sent to the email below.
              </p>
              <div className="row" style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <LocField label="Contact name" k="name" loc={draft.singleLocation} onChange={(key, val) => dispatch({ type: "setSingleLoc", key, value: val })} />
                <LocField
                  label="Notification email"
                  k="email"
                  type="email"
                  loc={draft.singleLocation}
                  onChange={(key, val) => dispatch({ type: "setSingleLoc", key, value: val })}
                />
                <LocField
                  label="Phone (optional)"
                  k="phone"
                  loc={draft.singleLocation}
                  onChange={(key, val) => dispatch({ type: "setSingleLoc", key, value: val })}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <LocField label="Address" k="line1" loc={draft.singleLocation} onChange={(key, val) => dispatch({ type: "setSingleLoc", key, value: val })} block />
              </div>
              <div style={{ marginBottom: 12 }}>
                <LocField
                  label="Address line 2 (optional)"
                  k="line2"
                  loc={draft.singleLocation}
                  onChange={(key, val) => dispatch({ type: "setSingleLoc", key, value: val })}
                  block
                />
              </div>
              <div className="row" style={{ display: "flex", gap: 12 }}>
                <LocField label="City" k="city" loc={draft.singleLocation} onChange={(key, val) => dispatch({ type: "setSingleLoc", key, value: val })} />
                <LocField label="State" k="state" loc={draft.singleLocation} onChange={(key, val) => dispatch({ type: "setSingleLoc", key, value: val })} />
                <LocField
                  label="PIN / Postal code"
                  k="pincode"
                  loc={draft.singleLocation}
                  onChange={(key, val) => dispatch({ type: "setSingleLoc", key, value: val })}
                />
                <div className="field" style={{ flex: 1 }}>
                  <label className="lbl">Country</label>
                  <select
                    className="inp"
                    value={draft.singleLocation.country || "IN"}
                    onChange={(e) => dispatch({ type: "setSingleLoc", key: "country", value: e.target.value })}
                  >
                    <option value="IN">India</option>
                    <option value="AE">UAE</option>
                    <option value="US">USA</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          <RecipientPicker
            title="Who's receiving this?"
            subtitle="Choose who you would like to send these items to."
            contacts={vm.contacts}
            selected={draft.selRecips}
            onToggle={(rid) => dispatch({ type: "toggleRecip", id: rid })}
            onDeselectAll={() => dispatch({ type: "deselectRecips" })}
            showModes={false}
          />
          {draft.mode === "surprise" && vm.surpriseMissing.length > 0 && (
            <div className="banner" style={{ marginTop: 14 }}>
              <b>{vm.surpriseMissing.length} recipient(s) missing a shipping address.</b> Surprise
              sends need addresses up front. Add them on the Contacts page before continuing.
            </div>
          )}
        </>
      )}

      {vm.step === 2 && (
        <RecipientExperience
          shopName={vm.shopName}
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
                  The {vm.account} team
                </div>
              </div>
            </div>
          }
        />
      )}

      {vm.step === 3 && (
        <>
          <h1 style={{ fontSize: 24, marginBottom: 16 }}>Checkout</h1>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <PaymentPanel
              wallet={vm.wallet}
              wallets={vm.wallets}
              selected={draft.pay}
              onSelect={(pay) => dispatch({ type: "setPay", pay })}
              selectedWalletId={vm.selectedWalletId}
              onWalletSelect={vm.onWalletSelect}
              walletAvailable={vm.walletAvailable}
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
                onClick={vm.onPayAndSend}
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
