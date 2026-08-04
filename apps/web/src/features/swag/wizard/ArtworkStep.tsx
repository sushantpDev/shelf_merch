import { useEffect, useRef, useState, type DragEvent } from "react";
import { Check, CircleHelp, Info, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { mediaUrlForCanvas } from "@/lib/mediaUrl";
import type { UiProduct } from "@/services/mappers";
import { MockupCanvas, buildMockupLayers } from "../MockupCanvas";
import {
  areaPlacementKey,
  listPrintAreas,
  placementKey,
  primaryAreaKey,
  printAreaStableKey,
  type Placement,
} from "../mockup-bake";
import type { ArtFile } from "../swagDraft";
import { rememberArtwork, type PreviousArtwork } from "./artworkHistory";

const ART_ACCEPT = /\.(svg|png|jpe?g|ai)$/i;
const ART_MAX = 5 * 1024 * 1024;

type PrintQuality = "good" | "poor";

export function ArtworkStep({
  products,
  art,
  areaArts,
  placements,
  placementEpoch,
  previousUploads,
  onSetArt,
  onClearArt,
  onSetAreaArt,
  onSetAreaArts,
  onClearAreaArt,
  onResetPlacements,
  onPlacementChange,
}: {
  products: UiProduct[];
  art: ArtFile | null;
  areaArts: Record<string, ArtFile>;
  placements: Record<string, Placement>;
  placementEpoch: number;
  previousUploads: PreviousArtwork[];
  onSetArt: (art: ArtFile) => void;
  onClearArt: () => void;
  onSetAreaArt: (key: string, art: ArtFile) => void;
  onSetAreaArts: (keys: string[], art: ArtFile) => void;
  onClearAreaArt: (key: string) => void;
  onResetPlacements: () => void;
  onPlacementChange: (key: string, placement: Placement) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  /** Null until the user clicks a placeholder on a mockup. */
  const [focus, setFocus] = useState<{ productIdx: number; areaKey: string } | null>(null);

  useEffect(() => {
    if (!products.length || !focus) return;
    const p = products[Math.min(focus.productIdx, products.length - 1)] || products[0];
    const keys = listPrintAreas(p).map((a, i) => printAreaStableKey(a, i));
    const nextKey = keys.includes(focus.areaKey)
      ? focus.areaKey
      : keys[0] || primaryAreaKey(p);
    const nextIdx = Math.min(focus.productIdx, products.length - 1);
    if (nextIdx !== focus.productIdx || nextKey !== focus.areaKey) {
      setFocus({ productIdx: nextIdx, areaKey: nextKey });
    }
  }, [products, focus]);

  const focusedProduct =
    focus != null ? products[focus.productIdx] || products[0] : null;
  const focusedAreas = focusedProduct ? listPrintAreas(focusedProduct) : [];
  const focusedArea =
    focus && focusedProduct
      ? focusedAreas.find((a, i) => printAreaStableKey(a, i) === focus.areaKey) ||
        focusedAreas[0]
      : null;
  const focusedAreaLabel = focusedArea?.label || focus?.areaKey || "print area";
  const focusedDraftKey =
    focus && focusedProduct
      ? areaPlacementKey(focusedProduct, focus.productIdx, focus.areaKey)
      : "";
  const focusedAreaArt = focusedDraftKey ? areaArts[focusedDraftKey] : null;

  const assignedCount = Object.keys(areaArts).length;
  const totalAreas = products.reduce((n, p) => n + Math.max(1, listPrintAreas(p).length), 0);
  const canUpload = Boolean(focus && focusedDraftKey);

  function remember(file: ArtFile) {
    rememberArtwork({
      id: file.preview,
      name: file.name,
      preview: file.preview,
      fileType: fileTypeFromName(file.name),
    });
  }

  function assignToFocused(file: ArtFile) {
    if (!focus || !focusedDraftKey) {
      toast.error("Select a print-area placeholder on the mockup first");
      return;
    }
    onSetAreaArt(focusedDraftKey, file);
    remember(file);
    toast.success(`Artwork added to ${focusedAreaLabel}`);
  }

  function onPick(file: File) {
    if (!canUpload) {
      toast.error("Select a print-area placeholder on the mockup first");
      return;
    }
    if (!ART_ACCEPT.test(file.name)) {
      toast.error("Accepted formats: SVG, PNG, JPG, AI");
      return;
    }
    if (file.size > ART_MAX) {
      toast.error("File must be 5 MB or smaller");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      assignToFocused({ name: file.name, preview: String(reader.result), file });
    };
    reader.readAsDataURL(file);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onPick(file);
  }

  function applyPrevious(item: PreviousArtwork) {
    assignToFocused({ name: item.name, preview: item.preview });
  }

  function applyToAllAreasOnProduct(file: ArtFile) {
    if (!focusedProduct || focus == null) return;
    const areas = listPrintAreas(focusedProduct);
    const list = areas.length ? areas : [null];
    const keys = list.map((a, i) =>
      areaPlacementKey(focusedProduct, focus.productIdx, printAreaStableKey(a, i)),
    );
    onSetAreaArts(keys, file);
    remember(file);
    toast.success(`Artwork applied to all ${keys.length} print areas`);
  }

  function applyToEveryArea(file: ArtFile) {
    const keys: string[] = [];
    products.forEach((p, idx) => {
      const areas = listPrintAreas(p);
      const list = areas.length ? areas : [null];
      list.forEach((a, i) => keys.push(areaPlacementKey(p, idx, printAreaStableKey(a, i))));
    });
    onSetAreaArts(keys, file);
    onSetArt(file);
    remember(file);
    toast.success(`Artwork applied to ${keys.length} print areas`);
  }

  return (
    <div className="sw-art-studio">
      <div className="sw-art-layout">
        <header className="sw-art-page-head">
          <h1>Add artwork to your products</h1>
          <p className="sw-art-page-lead">
            Click a placeholder on the mockup, then upload artwork for that area. Each placeholder
            can have its own design. DTF decoration ·{" "}
            <span className="sw-art-page-info" title="Decoration info" aria-label="More information">
              <Info size={11} strokeWidth={2.5} />
            </span>
          </p>
        </header>

        {!assignedCount && !bannerDismissed ? (
          <div className="sw-art-alert">
            <span>
              Start by selecting a dashed print-area box on the mockup, then upload artwork for that
              placeholder.
            </span>
            <button
              type="button"
              className="sw-art-alert-close"
              aria-label="Dismiss"
              onClick={() => setBannerDismissed(true)}
            >
              <X size={14} />
            </button>
          </div>
        ) : null}

        <aside className="sw-art-panel">
          <h2 className="sw-art-panel-title">Artwork</h2>

          <div
            style={{
              marginBottom: 12,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: canUpload ? "var(--surface-2)" : "transparent",
            }}
          >
            <div className="mut3" style={{ fontSize: 11, marginBottom: 4 }}>
              Selected placeholder
            </div>
            {canUpload && focusedProduct ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {focusedProduct.nm} · {focusedAreaLabel}
                </div>
                {focusedArea?.widthIn && focusedArea?.heightIn ? (
                  <div className="mut3" style={{ fontSize: 12, marginTop: 2 }}>
                    {Number(focusedArea.widthIn).toFixed(2)}″ ×{" "}
                    {Number(focusedArea.heightIn).toFixed(2)}″
                    {focusedArea.dpi ? ` · ${focusedArea.dpi} DPI` : ""}
                  </div>
                ) : null}
              </>
            ) : (
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                Click a print-area box on a mockup to select it
              </div>
            )}
          </div>

          <div className="sw-art-tab-body sw-art-upload-body">
            {focusedAreaArt ? (
              <ArtworkPickRow
                preview={focusedAreaArt.preview}
                name={focusedAreaArt.name}
                fileType={fileTypeFromName(focusedAreaArt.name)}
                selected
                displayOnly
                onRemove={() => {
                  if (!focusedDraftKey) return;
                  onClearAreaArt(focusedDraftKey);
                  toast.success("Removed artwork from this print area");
                }}
              />
            ) : null}

            <button
              type="button"
              className={`sw-art-upload-area${dragging ? " drag" : ""}`}
              disabled={!canUpload}
              onClick={() => {
                if (!canUpload) {
                  toast.error("Select a print-area placeholder on the mockup first");
                  return;
                }
                fileRef.current?.click();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (canUpload) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              style={{ opacity: canUpload ? 1 : 0.55, cursor: canUpload ? "pointer" : "not-allowed" }}
            >
              <Upload size={18} />
              <span>
                {focusedAreaArt
                  ? `Replace artwork for ${focusedAreaLabel}`
                  : canUpload
                    ? `Upload artwork for ${focusedAreaLabel}`
                    : "Select a placeholder first"}
              </span>
            </button>
          </div>

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

          {previousUploads.length > 0 ? (
            <div style={{ marginTop: 16 }}>
              <div className="mut3" style={{ fontSize: 11, marginBottom: 8 }}>
                Previous uploads
              </div>
              <div className="sw-art-prev-scroll">
                <div className="sw-art-tab-body sw-art-prev-list">
                  {previousUploads.map((item) => (
                    <ArtworkPickRow
                      key={item.id}
                      preview={item.preview}
                      name={item.name}
                      fileType={item.fileType}
                      selected={focusedAreaArt?.preview === item.preview}
                      onSelect={() => {
                        if (!canUpload) {
                          toast.error("Select a print-area placeholder on the mockup first");
                          return;
                        }
                        applyPrevious(item);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="sw-art-quality-tip">
            <CircleHelp size={14} />
            <span>
              Choose a high-quality file to prevent production delays and ensure the best results.
              Use a logo with a transparent background and ensure all other artwork has a resolution
              of at least 300 DPI.
            </span>
          </div>

          {focusedAreaArt ? (
            <div className="col" style={{ gap: 8, marginTop: 8 }}>
              <button
                type="button"
                className="btn btn-soft btn-block btn-sm"
                disabled={!focusedProduct}
                onClick={() => applyToAllAreasOnProduct(focusedAreaArt)}
              >
                Use on all areas on this product
              </button>
              {products.length > 1 || focusedAreas.length > 1 ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-block btn-sm"
                  onClick={() => applyToEveryArea(focusedAreaArt)}
                >
                  Use on every print area
                </button>
              ) : null}
            </div>
          ) : null}

          {assignedCount > 0 ? (
            <button
              type="button"
              className="btn btn-ghost btn-block btn-sm sw-art-reset"
              onClick={() => {
                onClearArt();
                onResetPlacements();
                toast.success("Cleared artwork from all print areas");
              }}
            >
              Clear all area artwork
            </button>
          ) : null}
        </aside>

        <div className="sw-art-preview-stage">
          <div className="sw-art-preview-head">
            <div>
              <div className="sw-art-preview-title">Your mockups</div>
              <div className="mut3 sw-art-preview-hint">
                Click a placeholder · upload artwork · drag to move · corners to scale
              </div>
            </div>
            {assignedCount > 0 ? (
              <span className="sw-art-applied-badge">
                <Check size={13} strokeWidth={2.5} />
                {assignedCount}/{totalAreas} areas have artwork
              </span>
            ) : null}
          </div>

          <div className="sw-art-preview-scroll">
            <div className="sw-mockups">
              {products.map((p, idx) => (
                <ProductArtworkCard
                  key={placementKey(p, idx)}
                  product={p}
                  idx={idx}
                  areaArts={areaArts}
                  activeAreaKey={focus?.productIdx === idx ? focus.areaKey : undefined}
                  placements={placements}
                  placementEpoch={placementEpoch}
                  onFocusArea={(areaKey) => setFocus({ productIdx: idx, areaKey })}
                  onPlacementChange={onPlacementChange}
                  onClearAreaArt={onClearAreaArt}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductArtworkCard({
  product,
  idx,
  areaArts,
  activeAreaKey,
  placements,
  placementEpoch,
  onFocusArea,
  onPlacementChange,
  onClearAreaArt,
}: {
  product: UiProduct;
  idx: number;
  areaArts: Record<string, ArtFile>;
  activeAreaKey?: string;
  placements: Record<string, Placement>;
  placementEpoch: number;
  onFocusArea: (areaKey: string) => void;
  onPlacementChange: (key: string, placement: Placement) => void;
  onClearAreaArt: (key: string) => void;
}) {
  const areas = listPrintAreas(product);
  const draftKey = activeAreaKey
    ? areaPlacementKey(product, idx, activeAreaKey)
    : "";
  const areaArt = draftKey ? areaArts[draftKey] : null;
  const layers = buildMockupLayers(product, {
    idx,
    areaArts,
    placements,
    activeAreaKey,
  });
  const activeLabel =
    (activeAreaKey &&
      areas.find((a, i) => printAreaStableKey(a, i) === activeAreaKey)?.label) ||
    activeAreaKey ||
    null;

  return (
    <div
      className="pcard mockup-card sw-mockup-card"
      style={{
        outline: activeAreaKey ? "2px solid var(--brand)" : undefined,
        outlineOffset: 2,
      }}
    >
      <MockupCanvas
        product={product}
        layers={layers}
        activeAreaKey={activeAreaKey}
        resetEpoch={placementEpoch}
        onSelectArea={onFocusArea}
        onChange={(next, areaKey) => {
          onPlacementChange(areaPlacementKey(product, idx, areaKey), next);
        }}
      />

      <div className="meta">
        {product.brand ? <div className="brand">{product.brand}</div> : null}
        <div className="nm">{product.nm}</div>
        <div
          className="row"
          style={{ gap: 8, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}
        >
          <div className="mut3" style={{ fontSize: 11 }}>
            {activeLabel
              ? areaArt
                ? `Editing ${activeLabel} — drag artwork inside the box`
                : `${activeLabel} selected — upload artwork in the left panel`
              : "Click a dashed placeholder to select it"}
          </div>
          {areaArt && draftKey ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 11, padding: "2px 8px" }}
              onClick={() => {
                onClearAreaArt(draftKey);
                toast.success("Removed artwork from this print area");
              }}
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ArtworkPickRow({
  preview,
  name,
  fileType,
  selected,
  displayOnly,
  onSelect,
  onRemove,
}: {
  preview: string;
  name?: string;
  fileType: string;
  selected: boolean;
  displayOnly?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
}) {
  const [quality, setQuality] = useState<PrintQuality | null>(null);

  useEffect(() => {
    let cancelled = false;
    assessPrintQuality(preview).then((q) => {
      if (!cancelled) setQuality(q);
    });
    return () => {
      cancelled = true;
    };
  }, [preview]);

  return (
    <div
      className={`sw-art-pick-row${selected ? " on" : ""}${displayOnly ? " static" : ""}${onRemove ? " has-delete" : ""}`}
    >
      <div className="sw-art-pick-main-wrap">
        {displayOnly ? (
          <div className="sw-art-pick-main">
            <span className="sw-art-pick-thumb">
              <img src={preview} alt="" />
            </span>
            <span className="sw-art-pick-meta">
              {name ? <span className="sw-art-pick-name">{name}</span> : null}
              <span className="sw-art-pick-quality">
                Print Quality:{" "}
                <strong className={quality === "poor" ? "poor" : quality === "good" ? "good" : ""}>
                  {quality === "poor"
                    ? "Poor Quality"
                    : quality === "good"
                      ? "Good Quality"
                      : "Checking…"}
                </strong>
              </span>
              <span className="mut3 sw-art-pick-type">File Type: {fileType}</span>
            </span>
          </div>
        ) : (
          <button type="button" className="sw-art-pick-main" onClick={onSelect}>
            <span className="sw-art-pick-thumb">
              <img src={preview} alt="" />
            </span>
            <span className="sw-art-pick-meta">
              {name ? <span className="sw-art-pick-name">{name}</span> : null}
              <span className="mut3 sw-art-pick-type">File Type: {fileType}</span>
            </span>
          </button>
        )}
        {onRemove ? (
          <button
            type="button"
            className="sw-art-pick-remove"
            aria-label="Delete artwork"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 size={18} strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function fileTypeFromName(name: string) {
  const ext = name.split(".").pop()?.toUpperCase();
  return ext || "PNG";
}

function assessPrintQuality(preview: string): Promise<PrintQuality> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      resolve(img.naturalWidth >= 800 && img.naturalHeight >= 800 ? "good" : "poor");
    };
    img.onerror = () => resolve("poor");
    img.src = mediaUrlForCanvas(preview) || preview;
  });
}
