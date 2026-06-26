import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { UiProduct } from "@/services/mappers";
import { detailRows, productSwatches, productUniqueId } from "./types";

type Selected = { product: UiProduct; index: number } | null;
type Tab = "description" | "features" | "size";

const TABS: [Tab, string][] = [
  ["description", "Description"],
  ["features", "Key features"],
  ["size", "Size Guide"],
];

/** Read-only catalog product detail (description / key features / size guide). */
export function ProductQuickView({
  selected,
  onOpenChange,
}: {
  selected: Selected;
  onOpenChange: (open: boolean) => void;
}) {
  const [tab, setTab] = useState<Tab>("description");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (selected) {
      setTab("description");
      setExpanded(false);
    }
  }, [selected]);

  return (
    <Dialog open={selected !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm-modal">
        {selected && (
          <Body
            product={selected.product}
            index={selected.index}
            tab={tab}
            setTab={setTab}
            expanded={expanded}
            setExpanded={setExpanded}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Body({
  product,
  index,
  tab,
  setTab,
  expanded,
  setExpanded,
}: {
  product: UiProduct;
  index: number;
  tab: Tab;
  setTab: (t: Tab) => void;
  expanded: boolean;
  setExpanded: (b: boolean) => void;
}) {
  const title = product.brand ? `${product.brand} ${product.nm}` : product.nm;
  const src = resolveMediaUrl(product.mockupUrl) || resolveMediaUrl(product.imgUrl);
  const desc = String(product.description || "");
  const short = desc.length > 180 && !expanded ? `${desc.slice(0, 180).trim()}…` : desc;
  const featureRows = detailRows(product.keyFeatures);
  const sizeRows = detailRows(product.sizeGuide).filter(([label]) => !/^feature$/i.test(label));
  const swatches = productSwatches(product);

  return (
    <div className="modal-pad">
      <DialogHeader>
        <div className="eyebrow">
          #{productUniqueId(product, index)}
          {product.price ? ` · ${product.price}` : ""}
        </div>
        <DialogTitle style={{ fontSize: 20 }}>{title}</DialogTitle>
        <DialogDescription className="muted" style={{ fontSize: 13 }}>
          Ready to customize with your artwork.
        </DialogDescription>
      </DialogHeader>

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
              <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                {swatches.map((s) => (
                  <span
                    key={s.name}
                    title={s.name}
                    className="sw"
                    style={{ background: s.hex, width: 20, height: 20, borderRadius: 5 }}
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
              <p style={{ whiteSpace: "pre-line" }}>{short || "No description available."}</p>
              {desc.length > 180 && (
                <button
                  type="button"
                  className="lnk"
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? "See less" : "See more"}
                </button>
              )}
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
              {sizeRows.length > 0 ? (
                <div className="pd-size-table">
                  <div className="pd-size-head">
                    <div>Feature</div>
                    <div>Details</div>
                  </div>
                  {sizeRows.map(([label, value], i) => (
                    <div key={`${label}-${i}`} className="pd-size-row">
                      <div>{label}</div>
                      <div style={{ whiteSpace: "pre-line" }}>{value}</div>
                    </div>
                  ))}
                </div>
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
