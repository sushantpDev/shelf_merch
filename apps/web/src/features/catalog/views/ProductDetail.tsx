import { useEffect, useState } from "react";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { UiProduct } from "@/services/mappers";
import { detailRows, productSwatches, productUniqueId } from "../types";
import { SizeGuideTable } from "@/components/SizeGuideTable";

type Tab = "description" | "features" | "size";

const TABS: [Tab, string][] = [
  ["description", "Description"],
  ["features", "Key features"],
  ["size", "Size Guide"],
];

/** Read-only catalog product detail (description / key features / size guide). */
export function ProductDetail({ product, index }: { product: UiProduct; index: number }) {
  const [tab, setTab] = useState<Tab>("description");

  useEffect(() => {
    setTab("description");
  }, [product.id]);

  const title = product.brand ? `${product.brand} ${product.nm}` : product.nm;
  const src =
    resolveMediaUrl(product.mockupUrl) ||
    resolveMediaUrl(product.photoUrl) ||
    resolveMediaUrl(product.imgUrl);
  const desc = String(product.description || "");
  const featureRows = detailRows(product.keyFeatures);
  const swatches = productSwatches(product);

  return (
    <div>
      <div className="eyebrow">
        #{productUniqueId(product, index)}
        {product.price ? ` · ${product.price}` : ""}
      </div>
      <h1 style={{ fontSize: 20, margin: "4px 0 6px" }}>{title}</h1>
      <p className="muted" style={{ fontSize: 13, margin: 0 }}>
        Ready to customize with your artwork.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 18, marginTop: 14 }}>
        <div
          className="img"
          style={{
            background: "#f4f6f4",
            borderRadius: "var(--r-sm)",
            aspectRatio: "1 / 1",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
          }}
        >
          {src ? (
            <img
              src={src}
              alt={product.nm}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <span className="mut3">No image</span>
          )}
        </div>

        <div>
          {swatches.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div className="lbl" style={{ marginBottom: 6 }}>
                Colors
              </div>
              <div className="row cat-swatch-row" style={{ gap: 8, flexWrap: "wrap" }}>
                {swatches.map((s) => (
                  <span
                    key={s.name}
                    className="cat-swatch"
                    data-label={s.name}
                    aria-label={s.name}
                    style={{ background: s.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="pd-detail-tabs" role="tablist" aria-label="Product information">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                className={tab === key ? "on" : ""}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "description" && (
            <div className="pd-tab-panel pd-description-panel on" role="tabpanel">
              <p style={{ whiteSpace: "pre-line" }}>{desc || "No description available."}</p>
            </div>
          )}

          {tab === "features" && (
            <div className="pd-tab-panel on" role="tabpanel">
              {featureRows.length > 0 ? (
                <div className="pd-feature-card">
                  {featureRows.map(([label, value], i) => (
                    <div key={`${label}-${i}`} className="pd-feature-row">
                      <div>{label}</div>
                      <div style={{ whiteSpace: "pre-line" }}>{value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No key features listed.</p>
              )}
            </div>
          )}

          {tab === "size" && (
            <div className="pd-tab-panel on" role="tabpanel">
              {product.sizeGuide?.trim() ? (
                <SizeGuideTable sizeGuide={product.sizeGuide} />
              ) : (
                <p className="muted">No size guide available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
