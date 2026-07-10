import { useRef } from "react";
import { Check, Upload } from "lucide-react";
import { toast } from "sonner";
import type { UiProduct } from "@/services/mappers";
import { ProductThumb } from "@/features/shops/ProductThumb";
import { MockupCanvas } from "../MockupCanvas";
import { placementKey, type Placement } from "../mockup-bake";
import type { ArtFile } from "../swagDraft";

const ART_ACCEPT = /\.(svg|png|jpe?g|ai)$/i;
const ART_MAX = 5 * 1024 * 1024;

export function ArtworkStep({
  products,
  art,
  placements,
  onSetArt,
  onClearArt,
  onResetPlacements,
  onPlacementChange,
}: {
  products: UiProduct[];
  art: ArtFile | null;
  placements: Record<string, Placement>;
  onSetArt: (art: ArtFile) => void;
  onClearArt: () => void;
  onResetPlacements: () => void;
  onPlacementChange: (key: string, placement: Placement) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(file: File) {
    if (!ART_ACCEPT.test(file.name)) {
      toast.error("Accepted formats: SVG, PNG, JPG, AI");
      return;
    }
    if (file.size > ART_MAX) {
      toast.error("File must be 5 MB or smaller");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onSetArt({ name: file.name, preview: String(reader.result), file });
    reader.readAsDataURL(file);
  }

  return (
    <div className="sw-art-layout">
      <div className="sw-art-rail">
        <div className="sw-form-card">
          <div className="sw-eyebrow-badge">Step 3 of 3 · Artwork</div>
          <h1
            style={{
              fontSize: 26,
              margin: "10px 0",
              fontFamily: "var(--disp)",
              letterSpacing: "-.02em",
            }}
          >
            Add artwork
          </h1>
          <p className="muted" style={{ fontSize: 14, marginBottom: 20, lineHeight: 1.55 }}>
            Upload your company logo or design assets, then position it on each product. Adjust
            scaling and rotation directly on the mockups.
          </p>

          {art ? (
            <div
              className="row"
              style={{
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid var(--brand)",
                borderRadius: "var(--r-sm)",
                padding: "12px 14px",
                background: "var(--brand-50)",
                marginBottom: 12,
              }}
            >
              <div className="row" style={{ gap: 10, alignItems: "center" }}>
                <div
                  className="logo-chip"
                  style={{ width: 36, height: 36, overflow: "hidden", padding: 3 }}
                >
                  <img
                    src={art.preview}
                    alt="Artwork"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{art.name}</div>
              </div>
              <button
                type="button"
                className="xbtn"
                aria-label="Remove artwork"
                onClick={onClearArt}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="sw-art-dropzone"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={24} />
              <div style={{ fontWeight: 600, fontSize: 14 }}>Drag &amp; drop your artwork file</div>
              <div className="mut3" style={{ fontSize: 12, margin: "2px 0" }}>
                Supports SVG, PNG, JPG, AI up to 5MB
              </div>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".svg,.png,.jpg,.jpeg,.ai,image/svg+xml,image/png,image/jpeg"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPick(f);
              e.target.value = "";
            }}
          />
        </div>

        {art && (
          <>
            <div
              className="card"
              style={{ padding: 18, background: "var(--surface-2)", borderRadius: "var(--r-sm)" }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13.5,
                  marginBottom: 8,
                  color: "var(--ink-2)",
                  textTransform: "uppercase",
                }}
              >
                Design summary
              </div>
              <SummaryRow
                k="Products"
                v={`${products.length} item${products.length === 1 ? "" : "s"}`}
              />
              <SummaryRow k="Decoration" v="DTF transfer" />
              <SummaryRow k="Colour variants" v="All included" />
              <SummaryRow k="Artwork" v={art.name} />
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-block btn-sm"
              style={{ marginTop: 2 }}
              onClick={onResetPlacements}
            >
              Reset placement on all products
            </button>
          </>
        )}
      </div>

      <div>
        {art ? (
          <div
            className="row"
            style={{ alignItems: "center", gap: 14, marginBottom: 12, flexWrap: "wrap" }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Your mockups</div>
              <div className="mut3" style={{ fontSize: 12, marginTop: 2 }}>
                Drag to move · corner handles to scale · top handle to rotate.
              </div>
            </div>
            <div
              className="row"
              style={{
                gap: 8,
                alignItems: "center",
                fontSize: 12,
                color: "var(--green-600)",
                background: "var(--green-50)",
                border: "1px solid var(--green-600)",
                borderRadius: 999,
                padding: "5px 12px",
                fontWeight: 600,
              }}
            >
              <Check size={14} /> Applied to all {products.length} products · all colour variants
            </div>
          </div>
        ) : (
          <div
            className="banner"
            style={{ marginBottom: 16, background: "var(--blue-50)", color: "var(--blue-500)", border: "none" }}
          >
            Add your artwork on the left to preview it on every product — all colour variants are
            included.
          </div>
        )}

        <div className="sw-mockups">
          {products.map((p, idx) => {
            const key = placementKey(p, idx);
            return (
              <div key={key} className="pcard mockup-card" style={{ position: "relative" }}>
                {art ? (
                  <MockupCanvas
                    product={p}
                    artUrl={art.preview}
                    placement={placements[key]}
                    onChange={(placement) => onPlacementChange(key, placement)}
                  />
                ) : (
                  <ProductThumb product={p} branded />
                )}
                <div className="meta">
                  {p.brand && <div className="brand">{p.brand}</div>}
                  <div className="nm">{p.nm}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="sw-summary-row">
      <span className="k">{k}</span>
      <span className="v" title={v}>
        {v}
      </span>
    </div>
  );
}
