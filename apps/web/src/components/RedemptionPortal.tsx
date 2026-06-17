import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  getRedemptionCatalog,
  getRedemptionKit,
  getRedemptionPortal,
  sendRedemptionOtp,
  submitRedemption,
  trackRedemption,
  verifyRedemptionOtp,
  type KitRedemptionData,
} from "@/services/api-bridge";
import KitAcceptPortal from "./KitAcceptPortal";
import { StoreBanner, type StoreShop } from "./StoreBanner";
import StoreShell, { type StoreProduct, type CheckoutItem, type ShippingAddress } from "./store/StoreShell";
import "@/styles/shelf-merch.css";

type Step = "loading" | "portal" | "otp" | "shop" | "kit" | "track" | "error";

type Shop = StoreShop & { currencyMode?: "points" | "inr" | "priceless" };

type PortalData = {
  campaign: {
    name: string;
    type?: string;
    message?: { body?: string };
    shop?: Shop | null;
  };
  recipient: { name: string; creditAmount: number };
  alreadyVerified?: boolean;
  sessionToken?: string;
};

function isKitCampaign(portal: PortalData | null) {
  return portal?.campaign?.type === "kit" || portal?.campaign?.type === "items";
}

export default function RedemptionPortal({ token }: { token: string }) {
  const [step, setStep] = useState<Step>("loading");
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [error, setError] = useState("");
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [kitData, setKitData] = useState<KitRedemptionData | null>(null);
  const [order, setOrder] = useState<{ orderNumber?: string; status?: string } | null>(null);

  const enterRedemption = useCallback(
    async (session: string, portalData: PortalData) => {
      if (isKitCampaign(portalData)) {
        const kit = await getRedemptionKit(token, session);
        setKitData(kit);
        setStep("kit");
        return;
      }
      const catalog = (await getRedemptionCatalog(token, session)) as { products: StoreProduct[] };
      setProducts(catalog.products || []);
      setStep("shop");
    },
    [token],
  );

  const loadPortal = useCallback(async () => {
    setStep("loading");
    setError("");
    try {
      const data = (await getRedemptionPortal(token)) as PortalData;
      setPortal(data);
      if (data.alreadyVerified && data.sessionToken) {
        setSessionToken(data.sessionToken);
        await enterRedemption(data.sessionToken, data);
        return;
      }
      setStep("portal");
    } catch (e) {
      if (e instanceof ApiError && e.code === "ALREADY_REDEEMED") {
        const track = await trackRedemption(token);
        setOrder(track as { orderNumber?: string; status?: string });
        setStep("track");
        return;
      }
      setError(e instanceof Error ? e.message : "Invalid redemption link");
      setStep("error");
    }
  }, [token, enterRedemption]);

  useEffect(() => {
    loadPortal();
  }, [loadPortal]);

  async function handleSendOtp() {
    setError("");
    try {
      await sendRedemptionOtp(token, contact);
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send OTP");
    }
  }

  async function handleVerifyOtp() {
    setError("");
    try {
      const res = await verifyRedemptionOtp(token, otp);
      setSessionToken(res.sessionToken);
      if (portal) await enterRedemption(res.sessionToken, portal);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid OTP");
    }
  }

  const handleCheckout = useCallback(
    async (items: CheckoutItem[], shippingAddress: ShippingAddress) => {
      const result = (await submitRedemption(
        token,
        sessionToken,
        { items, shippingAddress },
        `redeem-${token}-${Date.now()}`,
      )) as { orderNumber: string };
      return { orderNumber: result.orderNumber };
    },
    [token, sessionToken],
  );

  if (step === "loading") {
    return (
      <div className="auth">
        <div style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>Loading…</div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="auth">
        <div className="auth-form">
          <div className="inner">
            <h1>Redemption unavailable</h1>
            <p className="muted">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "track" && order) {
    return (
      <div className="auth">
        <div className="auth-form">
          <div className="inner">
            <div className="eyebrow">Order placed</div>
            <h1>Thank you, {portal?.recipient.name || "there"}!</h1>
            <p className="muted">
              Order <b>{order.orderNumber}</b> is {order.status || "being processed"}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "kit" && portal && kitData && sessionToken) {
    return (
      <KitAcceptPortal
        token={token}
        sessionToken={sessionToken}
        kitData={kitData}
        recipientName={portal.recipient.name}
        campaignName={portal.campaign.name}
        welcome={portal.campaign.message?.body}
        onAccepted={(orderNumber) => {
          setOrder({ orderNumber, status: "created" });
          setStep("track");
        }}
      />
    );
  }

  // Verified — hand off to the full multi-page store (points campaigns).
  if (step === "shop" && portal) {
    return (
      <StoreShell
        shop={portal.campaign.shop || { name: portal.campaign.name }}
        products={products}
        mode="redeem"
        currency={portal.campaign.shop?.currencyMode || "inr"}
        creditInr={portal.recipient.creditAmount}
        recipientName={portal.recipient.name}
        welcome={portal.campaign.message?.body}
        onCheckout={handleCheckout}
      />
    );
  }

  const kitFlow = isKitCampaign(portal);

  // Gate: branded landing + OTP verification before entering the store or kit accept flow.
  return (
    <div className="store" style={{ background: "var(--bg)" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 24px" }}>
        {portal?.campaign.shop ? (
          <StoreBanner shop={portal.campaign.shop} eyebrow="Your reward store" />
        ) : (
          <div className="eyebrow">{kitFlow ? "Your gift kit" : "Shelf Merch · Redeem your gift"}</div>
        )}
        <h1 style={{ fontSize: 26, marginBottom: 8 }}>{portal?.campaign.name}</h1>
        <p className="muted" style={{ marginBottom: 24 }}>
          {kitFlow ? (
            <>
              Hi {portal?.recipient.name} — your team sent you a kit. Verify your email or phone to view
              the items and accept your order.
            </>
          ) : (
            <>
              Hi {portal?.recipient.name} — you have{" "}
              <b>₹{portal?.recipient.creditAmount.toLocaleString("en-IN")}</b> to spend.
            </>
          )}
        </p>

        {error && (
          <div className="card" style={{ padding: 12, marginBottom: 16, color: "var(--danger)" }}>{error}</div>
        )}

        {step === "portal" && (
          <div className="card" style={{ padding: 24 }}>
            <p className="muted" style={{ marginBottom: 16 }}>
              {portal?.campaign.message?.body ||
                (kitFlow
                  ? "Verify your email or phone to view your kit and confirm shipping."
                  : "Verify your email or phone to enter the store and place your order.")}
            </p>
            <div className="field">
              <label className="lbl">Email or mobile</label>
              <input
                className="inp"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="you@company.com or +91…"
              />
            </div>
            <button className="btn btn-brand btn-block" style={{ marginTop: 16 }} onClick={handleSendOtp}>
              Send verification code
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="card" style={{ padding: 24 }}>
            <div className="field">
              <label className="lbl">6-digit code</label>
              <input
                className="inp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
              />
            </div>
            <button className="btn btn-brand btn-block" style={{ marginTop: 16 }} onClick={handleVerifyOtp}>
              {kitFlow ? "Verify & view kit" : "Verify & enter store"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
