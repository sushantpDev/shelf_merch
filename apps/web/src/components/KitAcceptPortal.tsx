import { useMemo, useState } from "react";
import {
  submitRedemption,
  type KitRedemptionData,
  type KitRedemptionItem,
} from "@/services/api-bridge";
import ProductArtworkMockup from "./store/ProductArtworkMockup";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { ShippingAddress } from "./store/StoreShell";

type Selection = { size?: string; color?: string };

function KitItemCard({
  item,
  selection,
  onChange,
}: {
  item: KitRedemptionItem;
  selection: Selection;
  onChange: (sel: Selection) => void;
}) {
  const imageCandidates = item.isDrinkware
    ? [item.imageUrl, item.primaryImageUrl, ...(item.imageUrls || []), item.baseImageUrl]
    : [item.maskImageUrl, item.imageUrl, item.primaryImageUrl, ...(item.imageUrls || []), item.baseImageUrl];

  const mockupProduct = {
    name: item.name,
    maskImageUrl: item.isDrinkware ? undefined : item.maskImageUrl || item.imageUrl,
    primaryImageUrl: item.imageUrl || item.primaryImageUrl,
    imageUrls: item.imageUrls,
    artworkUrl: item.artworkUrl,
    printAreas: item.printAreas,
  };

  return (
    <div className="card" style={{ padding: 16 }}>
      <div
        className="img-mockup"
        style={{
          aspectRatio: "1",
          borderRadius: 12,
          background: "#f4f6f4",
          overflow: "hidden",
          marginBottom: 12,
          position: "relative",
        }}
      >
        <ProductArtworkMockup
          product={mockupProduct}
          imageCandidates={imageCandidates}
          style={{ height: "100%" }}
        />
      </div>
      {item.brand && (
        <div className="mut3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em" }}>
          {item.brand}
        </div>
      )}
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>{item.name}</div>

      {item.requiresColor && item.colors.length > 0 && (
        <div className="field" style={{ marginBottom: 10 }}>
          <label className="lbl">Colour</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {item.colors.map((c) => (
              <button
                key={c}
                type="button"
                className={selection.color === c ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"}
                onClick={() => onChange({ ...selection, color: c })}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {item.requiresSize && item.sizes.length > 0 && (
        <div className="field">
          <label className="lbl">Size *</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {item.sizes.map((s) => (
              <button
                key={s}
                type="button"
                className={selection.size === s ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"}
                onClick={() => onChange({ ...selection, size: s })}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const EMPTY_ADDRESS: ShippingAddress = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "IN",
};

export default function KitAcceptPortal({
  token,
  sessionToken,
  kitData,
  recipientName,
  campaignName,
  welcome,
  onAccepted,
}: {
  token: string;
  sessionToken: string;
  kitData: KitRedemptionData;
  recipientName: string;
  campaignName: string;
  welcome?: string;
  onAccepted: (orderNumber: string) => void;
}) {
  const [selections, setSelections] = useState<Record<string, Selection>>(() =>
    Object.fromEntries(kitData.items.map((i) => [i.productId, {}])),
  );
  const [address, setAddress] = useState<ShippingAddress>({ ...EMPTY_ADDRESS, name: recipientName });
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);

  const missingSizes = useMemo(
    () => kitData.items.filter((i) => i.requiresSize && !selections[i.productId]?.size),
    [kitData.items, selections],
  );
  const missingColors = useMemo(
    () => kitData.items.filter((i) => i.requiresColor && !selections[i.productId]?.color),
    [kitData.items, selections],
  );

  async function acceptOrder() {
    setError("");
    if (missingSizes.length) {
      setError(`Please choose a size for: ${missingSizes.map((i) => i.name).join(", ")}`);
      return;
    }
    if (missingColors.length) {
      setError(`Please choose a colour for: ${missingColors.map((i) => i.name).join(", ")}`);
      return;
    }
    const missing = (["name", "phone", "line1", "city", "state", "pincode"] as const).filter(
      (k) => !address[k].trim(),
    );
    if (missing.length) {
      setError("Please complete your shipping address.");
      return;
    }

    setPlacing(true);
    try {
      const items = kitData.items.map((i) => {
        const sel = selections[i.productId] || {};
        const variant: { size?: string; color?: string } = {};
        if (sel.size) variant.size = sel.size;
        if (sel.color) variant.color = sel.color;
        return {
          productId: i.productId,
          qty: 1,
          ...(Object.keys(variant).length ? { variant } : {}),
        };
      });
      const result = (await submitRedemption(
        token,
        sessionToken,
        { items, shippingAddress: address },
        `kit-accept-${token}-${Date.now()}`,
      )) as { orderNumber: string };
      onAccepted(result.orderNumber);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not place your order");
    } finally {
      setPlacing(false);
    }
  }

  const kitArt = resolveMediaUrl(kitData.kit.artworkUrl);

  return (
    <div className="store" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div className="eyebrow">Your gift kit</div>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>{kitData.kit.name || campaignName}</h1>
        <p className="muted" style={{ marginBottom: 20, maxWidth: 560 }}>
          {welcome ||
            `Hi ${recipientName} — confirm your kit items${kitData.items.some((i) => i.requiresSize) ? ", choose sizes where needed" : ""}, then enter your shipping address to accept.`}
        </p>

        {kitArt && (
          <div className="card" style={{ padding: "16px 20px", marginBottom: 28, display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 10,
                background: "var(--brand-50)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                overflow: "hidden",
                padding: 6,
              }}
            >
              <img src={kitArt} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
            <div>
              <div className="mut3" style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 700 }}>
                Kit artwork
              </div>
              <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>Branded across all items</div>
            </div>
          </div>
        )}

        <h2 style={{ fontSize: 17, marginBottom: 14 }}>Items in your kit</h2>
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 14,
            marginBottom: 32,
          }}
        >
          {kitData.items.map((item) => (
            <KitItemCard
              key={item.productId}
              item={item}
              selection={selections[item.productId] || {}}
              onChange={(sel) => setSelections((prev) => ({ ...prev, [item.productId]: sel }))}
            />
          ))}
        </div>

        <h2 style={{ fontSize: 17, marginBottom: 14 }}>Shipping address</h2>
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field">
              <label className="lbl">Full name</label>
              <input
                className="inp"
                value={address.name}
                onChange={(e) => setAddress((a) => ({ ...a, name: e.target.value }))}
              />
            </div>
            <div className="field">
              <label className="lbl">Phone</label>
              <input
                className="inp"
                value={address.phone}
                onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))}
                placeholder="+91…"
              />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label className="lbl">Address line 1</label>
              <input
                className="inp"
                value={address.line1}
                onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
              />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label className="lbl">Address line 2 (optional)</label>
              <input
                className="inp"
                value={address.line2}
                onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
              />
            </div>
            <div className="field">
              <label className="lbl">City</label>
              <input
                className="inp"
                value={address.city}
                onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
              />
            </div>
            <div className="field">
              <label className="lbl">State</label>
              <input
                className="inp"
                value={address.state}
                onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
              />
            </div>
            <div className="field">
              <label className="lbl">PIN code</label>
              <input
                className="inp"
                value={address.pincode}
                onChange={(e) => setAddress((a) => ({ ...a, pincode: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="card" style={{ padding: 12, marginBottom: 16, color: "var(--danger)" }}>
            {error}
          </div>
        )}

        <button
          type="button"
          className="btn btn-brand"
          style={{ minWidth: 200 }}
          disabled={placing}
          onClick={acceptOrder}
        >
          {placing ? "Placing order…" : "Accept order"}
        </button>
      </div>
    </div>
  );
}
