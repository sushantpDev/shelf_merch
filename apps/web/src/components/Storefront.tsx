import { useEffect, useState } from "react";
import { getPublicStorefront, type StorefrontData } from "@/services/api-bridge";
import { StoreBanner } from "./StoreBanner";
import "@/styles/shelf-merch.css";

type State = "loading" | "ready" | "error";

export default function Storefront({ shopId }: { shopId: string }) {
  const [state, setState] = useState<State>("loading");
  const [data, setData] = useState<StorefrontData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getPublicStorefront(shopId);
        if (!active) return;
        setData(res);
        setState("ready");
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "This shop is unavailable");
        setState("error");
      }
    })();
    return () => {
      active = false;
    };
  }, [shopId]);

  if (state === "loading") {
    return (
      <div className="auth">
        <div style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>Loading shop…</div>
      </div>
    );
  }

  if (state === "error" || !data) {
    return (
      <div className="auth">
        <div className="auth-form">
          <div className="inner">
            <h1>Shop unavailable</h1>
            <p className="muted">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const isPoints = data.shop.currencyMode === "points";
  const price = (inr: number) => (isPoints ? `${Math.round(inr / 2).toLocaleString("en-IN")} pts` : `₹${inr.toLocaleString("en-IN")}`);

  return (
    <div className="auth" style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 24px" }}>
        <StoreBanner shop={data.shop} eyebrow="Branded store" />

        {data.products.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: "center" }}>
            <h3>No products yet</h3>
            <p className="muted">This shop hasn't published any products.</p>
          </div>
        ) : (
          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}
          >
            {data.products.map((p) => {
              const img = p.primaryImageUrl || p.imageUrls?.[0] || "";
              return (
                <div key={p._id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div
                    style={{
                      aspectRatio: "1 / 1",
                      background: "var(--surface-2)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={p.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span className="mut3" style={{ fontSize: 12 }}>
                        No image
                      </span>
                    )}
                  </div>
                  <div style={{ padding: 14 }}>
                    {p.brand && (
                      <div className="mut3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em" }}>
                        {p.brand}
                      </div>
                    )}
                    <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{p.name}</div>
                    <div className="pr" style={{ marginTop: 6, fontWeight: 700, color: "var(--brand)" }}>
                      {price(p.basePriceInr)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="muted" style={{ textAlign: "center", marginTop: 32, fontSize: 12 }}>
          Powered by Shelf Merch · Recipients redeem from a private invite link.
        </p>
      </div>
    </div>
  );
}
