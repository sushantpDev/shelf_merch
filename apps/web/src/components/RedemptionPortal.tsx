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
import "@/styles/shelf-merch.css";

type Step = "loading" | "portal" | "otp" | "catalog" | "submit" | "track" | "error";

type PortalData = {
  campaign: { name: string; message?: { body?: string }; shop?: StoreShop | null };
  recipient: { name: string; creditAmount: number };
};

type CatalogProduct = {
  _id: string;
  name: string;
  brand?: string;
  group?: string;
  basePriceInr: number;
};

export default function RedemptionPortal({ token }: { token: string }) {
  const [step, setStep] = useState<Step>("loading");
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [error, setError] = useState("");
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [order, setOrder] = useState<{ orderNumber?: string; status?: string } | null>(null);
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const loadPortal = useCallback(async () => {
    setStep("loading");
    setError("");
    try {
      const data = (await getRedemptionPortal(token)) as PortalData;
      setPortal(data);
      setAddress((a) => ({ ...a, name: data.recipient.name }));
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

  const creditUsed = Object.entries(selected).reduce((sum, [id, qty]) => {
    const p = products.find((x) => x._id === id);
    return sum + (p ? p.basePriceInr * qty : 0);
  }, 0);

  async function handleSendOtp() {
    try {
      await sendRedemptionOtp(token, contact);
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send OTP");
    }
  }

  async function handleVerifyOtp() {
    try {
      const res = await verifyRedemptionOtp(token, otp);
      setSessionToken(res.sessionToken);
      const catalog = (await getRedemptionCatalog(token, res.sessionToken)) as {
        products: CatalogProduct[];
      };
      setProducts(catalog.products || []);
      setStep("catalog");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid OTP");
    }
  }

  async function handleSubmit() {
    const items = Object.entries(selected)
      .filter(([, qty]) => qty > 0)
      .map(([productId, qty]) => ({ productId, qty }));
    if (!items.length) {
      setError("Pick at least one product");
      return;
    }
    const missing = (["name", "phone", "line1", "city", "state", "pincode"] as const).filter(
      (k) => !address[k].trim(),
    );
    if (missing.length) {
      setError("Please complete your shipping details (name, phone and full address).");
      return;
    }
    try {
      const result = (await submitRedemption(
        token,
        sessionToken,
        { items, shippingAddress: address },
        `redeem-${token}-${Date.now()}`,
      )) as { orderNumber: string };
      setOrder({ orderNumber: result.orderNumber, status: "created" });
      setStep("track");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit order");
    }
  }

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

  return (
    <div className="auth" style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
        {portal?.campaign.shop ? (
          <StoreBanner shop={portal.campaign.shop} />
        ) : (
          <div className="eyebrow">Shelf Merch · Redeem your gift</div>
        )}
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>{portal?.campaign.name}</h1>
        <p className="muted" style={{ marginBottom: 24 }}>
          Hi {portal?.recipient.name} — you have{" "}
          <b>₹{portal?.recipient.creditAmount.toLocaleString("en-IN")}</b> to spend.
        </p>

        {error && (
          <div className="card" style={{ padding: 12, marginBottom: 16, color: "var(--danger)" }}>
            {error}
          </div>
        )}

        {step === "portal" && (
          <div className="card" style={{ padding: 24 }}>
            <p className="muted" style={{ marginBottom: 16 }}>
              {portal?.campaign.message?.body ||
                "Verify your email or phone to browse the catalog and place your order."}
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
              Verify & continue
            </button>
          </div>
        )}

        {step === "catalog" && (
          <>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14 }}>
              {products.map((p) => (
                <div key={p._id} className="card" style={{ padding: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                  <div className="mut3" style={{ fontSize: 12 }}>
                    ₹{p.basePriceInr.toLocaleString("en-IN")}
                  </div>
                  <input
                    className="inp"
                    type="number"
                    min={0}
                    style={{ marginTop: 8, height: 36 }}
                    value={selected[p._id] || 0}
                    onChange={(e) =>
                      setSelected((s) => ({ ...s, [p._id]: Math.max(0, Number(e.target.value)) }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: 20, marginTop: 20 }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
                <span>Selected total</span>
                <b>₹{creditUsed.toLocaleString("en-IN")}</b>
              </div>
              <div className="field">
                <label className="lbl">Shipping address</label>
                <div className="row" style={{ gap: 12 }}>
                  <input
                    className="inp"
                    placeholder="Full name"
                    value={address.name}
                    onChange={(e) => setAddress({ ...address, name: e.target.value })}
                  />
                  <input
                    className="inp"
                    placeholder="Phone number"
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  />
                </div>
              </div>
              <input
                className="inp"
                placeholder="Address line"
                style={{ marginTop: 8 }}
                value={address.line1}
                onChange={(e) => setAddress({ ...address, line1: e.target.value })}
              />
              <div className="row" style={{ gap: 12, marginTop: 8 }}>
                <input
                  className="inp"
                  placeholder="City"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                />
                <input
                  className="inp"
                  placeholder="State"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                />
                <input
                  className="inp"
                  placeholder="PIN"
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                />
              </div>
              <button
                className="btn btn-brand btn-block"
                style={{ marginTop: 16 }}
                disabled={creditUsed > (portal?.recipient.creditAmount || 0)}
                onClick={handleSubmit}
              >
                Place order
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
