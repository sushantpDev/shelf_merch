import { useRef } from "react";
import { Check, Upload } from "lucide-react";
import { toast } from "sonner";
import type { UiProduct } from "@/services/mappers";
import { ProductThumb } from "@/features/shops/ProductThumb";
import { MockupCanvas } from "@/features/swag/MockupCanvas";
import { placementKey, type Placement } from "@/features/swag/mockup-bake";
import type { KitArtFile } from "./kitDraft";

const LOGO_ACCEPT = /\.(svg|png|webp|jpe?g)$/i;
const LOGO_MAX = 5 * 1024 * 1024;

export function KitBrandingStep({
  stepBadge,
  products,
  art,
  placements,
  notes,
  onSetArt,
  onClearArt,
  onResetPlacements,
  onPlacementChange,
  onNotes,
}: {
  stepBadge: string;
  products: UiProduct[];
  art: KitArtFile | null;
  placements: Record<string, Placement>;
  notes: string;
  onSetArt: (art: KitArtFile) => void;
  onClearArt: () => void;
  onResetPlacements: () => void;
  onPlacementChange: (key: string, placement: Placement) => void;
  onNotes: (notes: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const hasLogo = !!art?.preview;

  function onPick(file: File) {
    if (!LOGO_ACCEPT.test(file.name)) {
      toast.error("Accepted formats: SVG, PNG, WEBP, JPEG, JPG");
      return;
    }
    if (file.size > LOGO_MAX) {
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
          <div className="sw-eyebrow-badge">{stepBadge}</div>
          <h1
            style={{
              fontSize: 26,
              marginBottom: 10,
              fontFamily: "var(--disp)",
              letterSpacing: "-.02em",
              color: "var(--ink)",
            }}
          >
            Brand your kit
          </h1>
          <p className="muted" style={{ fontSize: 14, marginBottom: 20, lineHeight: 1.55 }}>
            Upload your company logo or design assets, then position it on each product. Our team
            will mock up every item for approval.
          </p>

          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10, color: "var(--ink-2)" }}>
            Artwork Source
          </div>

          {hasLogo ? (
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
                    src={art!.preview}
                    alt="Kit logo"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{art!.name}</div>
              </div>
              <button type="button" className="xbtn" aria-label="Remove logo" onClick={onClearArt}>
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
                Supports SVG, PNG, WEBP, JPEG up to 5MB
              </div>
              <span className="btn btn-soft btn-sm" style={{ marginTop: 4 }}>
                Browse local files
              </span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".svg,.png,.webp,.jpeg,.jpg,image/svg+xml,image/png,image/webp,image/jpeg"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPick(f);
              e.target.value = "";
            }}
          />

          <div className="field" style={{ marginTop: 18, marginBottom: 0 }}>
            <label className="lbl" style={{ fontWeight: 700 }}>
              Notes to design team{" "}
              <span
                className="mut3"
                style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0 }}
              >
                (optional)
              </span>
            </label>
            <textarea
              className="inp"
              rows={3}
              placeholder="e.g. White logo on the chest, full-colour on mugs"
              value={notes}
              onChange={(e) => onNotes(e.target.value)}
              style={{
                resize: "vertical",
                minHeight: 80,
                padding: "12px 16px",
                lineHeight: 1.5,
                marginTop: 8,
              }}
            />
          </div>
        </div>

        {hasLogo && (
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
                  letterSpacing: ".02em",
                  textTransform: "uppercase",
                }}
              >
                Kit summary
              </div>
              <SummaryRow
                k="Products"
                v={`${products.length} ${products.length === 1 ? "item" : "items"}`}
              />
              <SummaryRow k="Decoration" v="Design team mockup" />
              <SummaryRow k="Colour variants" v="All included" />
              <SummaryRow k="Logo" v={art!.name} />
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
        {hasLogo ? (
          <div
            className="row"
            style={{ alignItems: "center", gap: 14, marginBottom: 12, flexWrap: "wrap" }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Your mockups</div>
              <div className="mut3" style={{ fontSize: 12, marginTop: 2 }}>
                Drag to move · corner handles to scale · top handle to rotate. Each product keeps
                its own placement.
              </div>
            </div>
            <div
              className="row"
              style={{
                gap: 8,
                alignItems: "center",
                fontSize: 12,
                color: "#1A6E45",
                background: "var(--brand-50)",
                border: "1px solid #cfe9da",
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
            style={{ marginBottom: 16, background: "#eaf1fb", color: "#1c2a52", border: "none" }}
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
                {hasLogo ? (
                  <MockupCanvas
                    product={p}
                    artUrl={art!.preview}
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
