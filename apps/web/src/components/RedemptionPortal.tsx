import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  getRedemptionCatalog,
  getRedemptionPortal,
  sendRedemptionOtp,
  submitRedemption,
  trackRedemption,
  verifyRedemptionOtp,
} from "@/services/api-bridge";
import { StoreBanner, type StoreShop } from "./StoreBanner";
import StoreShell, { type StoreProduct, type CheckoutItem, type ShippingAddress } from "./store/StoreShell";
import "@/styles/shelf-merch.css";

type Step = "loading" | "portal" | "otp" | "shop" | "track" | "error";

type Shop = StoreShop & { currencyMode?: "points" | "inr" | "priceless" };

type PortalData = {
  campaign: { name: string; message?: { body?: string }; shop?: Shop | null };
  recipient: { name: string; creditAmount: number };
  alreadyVerified?: boolean;
  sessionToken?: string;
};

export default function RedemptionPortal({ token }: { token: string }) {
  const [step, setStep] = useState<Step>("loading");
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [error, setError] = useState("");
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [order, setOrder] = useState<{ orderNumber?: string; status?: string } | null>(null);

  const loadPortal = useCallback(async () => {
    setStep("loading");
    setError("");
    try {
      const data = (await getRedemptionPortal(token)) as PortalData;
      setPortal(data);
      if (data.alreadyVerified && data.sessionToken) {
        setSessionToken(data.sessionToken);
        const catalog = (await getRedemptionCatalog(token, data.sessionToken)) as { products: StoreProduct[] };
        setProducts(catalog.products || []);
        setStep("shop");
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
  }, [token]);

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
      const catalog = (await getRedemptionCatalog(token, res.sessionToken)) as { products: StoreProduct[] };
      setProducts(catalog.products || []);
      setStep("shop");
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

  // Verified — hand off to the full multi-page store.
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

  // Gate: branded landing + OTP verification before entering the store.
  return (
    <div className="store" style={{ background: "var(--bg)" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 24px" }}>
        {portal?.campaign.shop ? (
          <StoreBanner shop={portal.campaign.shop} eyebrow="Your reward store" />
        ) : (
          <div className="eyebrow">Shelf Merch · Redeem your gift</div>
        )}
        <h1 style={{ fontSize: 26, marginBottom: 8 }}>{portal?.campaign.name}</h1>
        <p className="muted" style={{ marginBottom: 24 }}>
          Hi {portal?.recipient.name} — you have{" "}
          <b>₹{portal?.recipient.creditAmount.toLocaleString("en-IN")}</b> to spend.
        </p>

        {error && (
          <div className="card" style={{ padding: 12, marginBottom: 16, color: "var(--danger)" }}>{error}</div>
        )}

        {step === "portal" && (
          <div className="card" style={{ padding: 24 }}>
            <p className="muted" style={{ marginBottom: 16 }}>
              {portal?.campaign.message?.body ||
                "Verify your email or phone to enter the store and place your order."}
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
              Verify & enter store
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
