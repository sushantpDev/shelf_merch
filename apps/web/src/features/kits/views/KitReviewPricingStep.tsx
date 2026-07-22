import { DesignedProductThumb } from "@/features/swag/DesignedProductThumb";
import type { UiProduct } from "@/services/mappers";
import { sumKitProductPrices } from "@/features/send/money";

function formatInr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

/** Create-kit final step — review selected products and dynamic kit cost. */
export function KitReviewPricingStep({
  kitName,
  products,
  artworkUrl,
}: {
  kitName: string;
  products: UiProduct[];
  artworkUrl?: string;
}) {
  const total = sumKitProductPrices(products);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <div className="row" style={{ gap: 10, alignItems: "center", marginBottom: 6 }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Review &amp; Pricing</h1>
          <span className="tag tag-ready">Step 4 of 4</span>
        </div>
        <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
          Confirm the items in &ldquo;{kitName}&rdquo; and the kit cost before publishing.
          Packaging and shipping are chosen when you send.
        </p>
      </header>

      <div className="card" style={{ padding: 22, marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 14px" }}>Selected Products</h3>
        {products.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No products selected.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {products.map((p) => (
              <li
                key={p.id || p.nm}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  paddingBottom: 12,
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 8,
                    overflow: "hidden",
                    background: "var(--gray-100)",
                    flexShrink: 0,
                  }}
                >
                  <DesignedProductThumb
                    product={p}
                    artworkUrl={p.mockupUrl ? undefined : artworkUrl}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{p.nm}</div>
                  {p.brand ? (
                    <div className="muted" style={{ fontSize: 12 }}>{p.brand}</div>
                  ) : null}
                </div>
                <b className="num" style={{ fontSize: 14, fontWeight: 800 }}>
                  {formatInr(p.basePriceInr ?? 0)}
                </b>
              </li>
            ))}
          </ul>
        )}

        <div
          className="row"
          style={{
            justifyContent: "space-between",
            alignItems: "baseline",
            marginTop: 16,
            paddingTop: 4,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>Total Kit Cost</span>
          <span style={{ display: "inline-flex", alignItems: "baseline" }}>
            <b className="num" style={{ fontSize: 22, fontFamily: "var(--disp)", fontWeight: 800 }}>
              {formatInr(total)}
            </b>
            <span style={{ fontSize: 14, fontWeight: 400, color: "var(--ink-2)" }}> / kit + GST</span>
          </span>
        </div>
        <p className="muted" style={{ margin: "8px 0 0", fontSize: 12 }}>
          Packaging, shipping, and GST are calculated at send time.
        </p>
      </div>
    </div>
  );
}
