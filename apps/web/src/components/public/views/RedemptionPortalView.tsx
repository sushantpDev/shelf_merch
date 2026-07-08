import KitAcceptPortal from "@/components/KitAcceptPortal";
import { LoadingState } from "@/components/LoadingState";
import { StoreBanner } from "@/components/StoreBanner";
import StoreShell from "@/components/store/StoreShell";
import type { RedemptionVm } from "../controllers/useRedemptionController";

/** Redemption portal view: branded OTP gate, then store / kit-accept / track. */
export function RedemptionPortalView(vm: RedemptionVm) {
  if (vm.step === "loading") {
    return <LoadingState message="Loading your gift…" />;
  }

  if (vm.step === "error") {
    return (
      <div className="auth">
        <div className="auth-form">
          <div className="inner">
            <h1>Redemption unavailable</h1>
            <p className="muted">{vm.error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (vm.step === "track" && vm.order) {
    return (
      <div className="auth">
        <div className="auth-form">
          <div className="inner">
            <div className="eyebrow">Order placed</div>
            <h1>Thank you, {vm.portal?.recipient.name || "there"}!</h1>
            <p className="muted">
              Order <b>{vm.order.orderNumber}</b> is {vm.order.status || "being processed"}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (vm.step === "kit" && vm.portal && vm.kitData && vm.sessionToken) {
    return (
      <KitAcceptPortal
        token={vm.token}
        sessionToken={vm.sessionToken}
        kitData={vm.kitData}
        recipientName={vm.portal.recipient.name}
        campaignName={vm.portal.campaign.name}
        welcome={vm.portal.campaign.message?.body}
        onAccepted={vm.onKitAccepted}
      />
    );
  }

  // Verified — hand off to the full multi-page store (points campaigns).
  if (vm.step === "shop" && vm.portal) {
    return (
      <StoreShell
        shop={vm.portal.campaign.shop || { name: vm.portal.campaign.name }}
        products={vm.products}
        mode="redeem"
        currency={vm.portal.campaign.shop?.currencyMode || "points"}
        creditInr={vm.portal.recipient.creditAmount}
        recipientName={vm.portal.recipient.name}
        recipientEmail={vm.portal.recipient.email}
        welcome={vm.portal.campaign.message?.body}
        onCheckout={vm.onCheckout}
        onLogout={vm.onLogout}
        onFetchOrders={vm.onFetchOrders}
        redemptionToken={vm.token}
        sessionToken={vm.sessionToken}
        cartPersistId={vm.token}
      />
    );
  }

  const { portal, isKitFlow } = vm;

  // Gate: branded landing + OTP verification before entering the store or kit accept flow.
  return (
    <div className="store" style={{ background: "var(--bg)" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 24px" }}>
        {portal?.campaign.shop ? (
          <StoreBanner shop={portal.campaign.shop} eyebrow="Your reward store" />
        ) : (
          <div className="eyebrow">
            {isKitFlow ? "Your gift kit" : "Shelf Merch · Redeem your gift"}
          </div>
        )}
        <h1 style={{ fontSize: 26, marginBottom: 8 }}>{portal?.campaign.name}</h1>
        <p className="muted" style={{ marginBottom: 24 }}>
          {isKitFlow ? (
            <>
              Hi {portal?.recipient.name} — your team sent you a kit. Verify your email or phone to
              view the items and accept your order.
            </>
          ) : (
            <>
              Hi {portal?.recipient.name} — you have{" "}
              <b>₹{portal?.recipient.creditAmount.toLocaleString("en-IN")}</b> to spend.
            </>
          )}
        </p>

        {vm.error && (
          <div className="card" style={{ padding: 12, marginBottom: 16, color: "var(--danger)" }}>
            {vm.error}
          </div>
        )}

        {vm.step === "portal" && (
          <div className="card" style={{ padding: 24 }}>
            <p className="muted" style={{ marginBottom: 16 }}>
              {portal?.campaign.message?.body ||
                (isKitFlow
                  ? "Verify your email or phone to view your kit and confirm shipping."
                  : "Verify your email or phone to enter the store and place your order.")}
            </p>
            <div className="field">
              <label className="lbl">Email or mobile</label>
              <input
                className="inp"
                value={vm.contact}
                onChange={(e) => vm.onContact(e.target.value)}
                placeholder="you@company.com or +91…"
              />
            </div>
            <button
              className="btn btn-brand btn-block"
              style={{ marginTop: 16 }}
              onClick={vm.onSendOtp}
              disabled={vm.isSendingOtp || !vm.contact.trim()}
              aria-busy={vm.isSendingOtp}
            >
              {vm.isSendingOtp ? "Sending…" : "Send verification code"}
            </button>
          </div>
        )}

        {vm.step === "otp" && (
          <div className="card" style={{ padding: 24 }}>
            <div className="field">
              <label className="lbl">6-digit code</label>
              <input
                className="inp"
                value={vm.otp}
                onChange={(e) => vm.onOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
              />
            </div>
            <button
              className="btn btn-brand btn-block"
              style={{ marginTop: 16 }}
              onClick={vm.onVerifyOtp}
              disabled={vm.isVerifyingOtp || vm.otp.trim().length !== 6}
              aria-busy={vm.isVerifyingOtp}
            >
              {vm.isVerifyingOtp
                ? "Verifying…"
                : isKitFlow
                  ? "Verify & view kit"
                  : "Verify & enter store"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
