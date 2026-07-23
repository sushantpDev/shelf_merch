import { useEffect, useRef, useState, type DragEvent } from "react";
import { Check, CircleHelp, Info, MoreHorizontal, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { mediaUrlForCanvas } from "@/lib/mediaUrl";
import type { UiProduct } from "@/services/mappers";
import { ProductThumb } from "@/features/shops/ProductThumb";
import { MockupCanvas } from "../MockupCanvas";
import { placementKey, type Placement } from "../mockup-bake";
import type { ArtFile } from "../swagDraft";
import { rememberArtwork, type PreviousArtwork } from "./artworkHistory";

const ART_ACCEPT = /\.(svg|png|jpe?g|ai)$/i;
const ART_MAX = 5 * 1024 * 1024;

type ArtTab = "upload" | "previous";
type PrintQuality = "good" | "poor";

export function ArtworkStep({
  products,
  art,
  placements,
  placementEpoch,
  previousUploads,
  onSetArt,
  onClearArt,
  onResetPlacements,
  onPlacementChange,
}: {
  products: UiProduct[];
  art: ArtFile | null;
  placements: Record<string, Placement>;
  placementEpoch: number;
  previousUploads: PreviousArtwork[];
  onSetArt: (art: ArtFile) => void;
  onClearArt: () => void;
  onResetPlacements: () => void;
  onPlacementChange: (key: string, placement: Placement) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<ArtTab>(previousUploads.length ? "previous" : "upload");
  const [dragging, setDragging] = useState(false);
  const [staging, setStaging] = useState<ArtFile | null>(art);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    if (art) setStaging(art);
  }, [art]);

  function clearStaging() {
    setStaging(null);
    if (art) onClearArt();
  }

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
    reader.onload = () =>
      setStaging({ name: file.name, preview: String(reader.result), file });
    reader.readAsDataURL(file);
    setTab("upload");
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onPick(file);
  }

  function applyArtwork() {
    if (!staging) return;
    onSetArt(staging);
    rememberArtwork({
      id: staging.preview,
      name: staging.name,
      preview: staging.preview,
      fileType: fileTypeFromName(staging.name),
    });
  }

  function selectPrevious(item: PreviousArtwork) {
    if (staging?.preview === item.preview) {
      setStaging(null);
      if (art?.preview === item.preview) onClearArt();
      return;
    }
    setStaging({
      name: item.name,
      preview: item.preview,
    });
  }

  return (
    <div className="sw-art-studio">
      <div className="sw-art-layout">
        <header className="sw-art-page-head">
          <h1>Add artwork to your products</h1>
          <p className="sw-art-page-lead">
            Upload your artwork and choose the products you want to apply it to. You can edit or
            update your design anytime. Items are created using DTF decoration methods.{" "}
            <span className="sw-art-page-info" title="Decoration info" aria-label="More information">
              <Info size={11} strokeWidth={2.5} />
            </span>
          </p>
        </header>

        {!art && !bannerDismissed ? (
          <div className="sw-art-alert">
            <span>
              Please add artwork before selecting your products. We&apos;ve included all colour
              variants.
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
          <h2 className="sw-art-panel-title">Add New Artwork</h2>

          <div className="sw-art-tabs" role="tablist" aria-label="Artwork source">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "upload"}
              className={`sw-art-tab${tab === "upload" ? " on" : ""}`}
              onClick={() => setTab("upload")}
            >
              Upload from device
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "previous"}
              className={`sw-art-tab${tab === "previous" ? " on" : ""}`}
              onClick={() => setTab("previous")}
            >
              Previous uploads
            </button>
          </div>

          {tab === "upload" ? (
            <div className="sw-art-tab-body sw-art-upload-body">
              {staging ? (
                <ArtworkPickRow
                  preview={staging.preview}
                  name={staging.name}
                  fileType={fileTypeFromName(staging.name)}
                  selected
                  displayOnly
                  onRemove={clearStaging}
                />
              ) : (
                <button
                  type="button"
                  className={`sw-art-upload-area${dragging ? " drag" : ""}`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                >
                  <Upload size={18} />
                  <span>Choose a file from your device</span>
                </button>
              )}
            </div>
          ) : (
            <div className="sw-art-prev-scroll">
              <div className="sw-art-tab-body sw-art-prev-list">
                {previousUploads.length ? (
                  previousUploads.map((item) => (
                    <ArtworkPickRow
                      key={item.id}
                      preview={item.preview}
                      name={item.name}
                      fileType={item.fileType}
                      selected={staging?.preview === item.preview}
                      onSelect={() => selectPrevious(item)}
                      onRemove={
                        staging?.preview === item.preview ? clearStaging : undefined
                      }
                    />
                  ))
                ) : (
                  <div className="sw-art-prev-empty mut3">
                    No previous uploads yet. Upload artwork from your device first.
                  </div>
                )}
              </div>
            </div>
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

          <div className="sw-art-quality-tip">
            <CircleHelp size={14} />
            <span>
              Choose a high-quality file to prevent production delays and ensure the best results.
              Use a logo with a transparent background and ensure all other artwork has a resolution
              of at least 300 DPI.{" "}
              <button type="button" className="lnk sw-art-quality-link">
                Learn more
              </button>
            </span>
          </div>

          <button
            type="button"
            className="btn btn-block sw-art-add-btn"
            disabled={!staging}
            onClick={applyArtwork}
          >
            Add artwork
          </button>

          {art ? (
            <button
              type="button"
              className="btn btn-ghost btn-block btn-sm sw-art-reset"
              onClick={() => {
                onResetPlacements();
                toast.success("Artwork placement reset on all products");
              }}
            >
              Reset placement on all products
            </button>
          ) : null}
        </aside>

        <div className="sw-art-preview-stage">
          {art ? (
            <div className="sw-art-preview-head">
              <div>
                <div className="sw-art-preview-title">Your mockups</div>
                <div className="mut3 sw-art-preview-hint">
                  Drag to move · corner handles to scale · top handle to rotate
                </div>
              </div>
              <span className="sw-art-applied-badge">
                <Check size={13} strokeWidth={2.5} />
                Applied to all {products.length} products
              </span>
            </div>
          ) : null}

          <div className="sw-art-preview-scroll">
            <div className="sw-mockups">
              {products.map((p, idx) => {
                const key = placementKey(p, idx);
                const previewArt = art?.preview ?? staging?.preview;
                return (
                  <div key={key} className="pcard mockup-card sw-mockup-card">
                    <button type="button" className="sw-mockup-menu" aria-label="Product options">
                      <MoreHorizontal size={16} />
                    </button>
                    {previewArt && art ? (
                      <MockupCanvas
                        product={p}
                        artUrl={previewArt}
                        placement={placements[key]}
                        resetEpoch={placementEpoch}
                        onChange={(placement) => onPlacementChange(key, placement)}
                      />
                    ) : (
                      <ProductThumb product={p} branded />
                    )}
                    <div className="meta">
                      {p.brand ? <div className="brand">{p.brand}</div> : null}
                      <div className="nm">{p.nm}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
                  {quality === "poor" ? "Poor Quality" : quality === "good" ? "Good Quality" : "Checking…"}
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
              {/* <span className="sw-art-pick-quality">
                Print Quality:{" "}
                <strong className={quality === "poor" ? "poor" : quality === "good" ? "good" : ""}>
                  {quality === "poor" ? "Poor Quality" : quality === "good" ? "Good Quality" : "Checking…"}
                </strong>
              </span> */}
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
