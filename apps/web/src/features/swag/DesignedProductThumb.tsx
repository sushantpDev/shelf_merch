import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement } from "react";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { TintedGarment } from "@/components/store/TintedGarment";
import type { UiProduct } from "@/services/mappers";
import { DEFAULT_MOCKUP_TINT_HEX, isDefaultMockupTint } from "./colors";
import {
  bakeTintedMockup,
  defaultPlacement,
  designImgUrl,
  pickPrintArea,
  productThumbUrl,
  type Placement,
} from "./mockup-bake";

function hexToRgbTuple(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Blend the printed artwork into the garment so it reads as ink on fabric
 * rather than a flat sticker. The tinted mask underneath already carries the
 * fabric's folds and shadows (recoloured by luminance); here we let those show
 * through the print by picking a blend mode + opacity from the garment colour:
 *  - Light fabrics → "multiply" so the print picks up the soft fabric shadows.
 *  - Dark fabrics  → "normal" so a full-colour print stays legible, with a
 *                    little transparency so the weave/shadow still reads.
 *  - Warm fabrics  → nudged slightly more opaque so the ink keeps popping.
 */
function artworkFabricFx(tintHex?: string): {
  opacity: number;
  mixBlendMode: CSSProperties["mixBlendMode"];
} {
  if (!tintHex || !/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(tintHex)) {
    return { opacity: 1, mixBlendMode: "normal" };
  }
  const [r, g, b] = hexToRgbTuple(tintHex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255; // perceived 0..1
  const warm = (r - b) / 255 > 0.1; // reddish/orange fabrics

  if (lum >= 0.62) {
    // Light garment: integrate the print with the fabric's soft shadows.
    return { opacity: 0.96, mixBlendMode: "multiply" };
  }
  if (lum <= 0.32) {
    // Dark garment: keep the colours bright, let a little texture through.
    return { opacity: warm ? 0.92 : 0.88, mixBlendMode: "normal" };
  }
  // Mid-tone garment: blend, but keep enough opacity to stay readable.
  return { opacity: warm ? 0.94 : 0.9, mixBlendMode: "multiply" };
}

function placementStyle(pl: Placement, artAspect: number): CSSProperties {
  return {
    position: "absolute",
    left: `${pl.xPct}%`,
    top: `${pl.yPct}%`,
    width: `${pl.wPct}%`,
    height: "auto",
    maxWidth: "none",
    maxHeight: "none",
    aspectRatio: `${1 / Math.max(artAspect, 0.01)}`,
    transform: `translate(-50%, -50%) rotate(${pl.rot || 0}deg)`,
    transformOrigin: "center center",
    objectFit: "contain",
    pointerEvents: "none",
    zIndex: 2,
  };
}

/** Square stage matching Konva / bakeMockup — placement % is of this box. */
function MockupStage({
  isolation,
  children,
}: {
  isolation?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="img img-mockup img-mockup-stage"
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        overflow: "hidden",
        ...(isolation ? { isolation: "isolate" as const } : null),
      }}
    >
      {children}
    </div>
  );
}

/** Garment fills the square stage the same way bakeMockup letterboxes the mask. */
const STAGE_GARMENT_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "contain",
  display: "block",
  margin: 0,
};

/** Live mask + artwork on the full square stage (Konva / bake coordinate system). */
function LiveArtworkComposite({
  product,
  base,
  overlay,
  savedPlacement,
}: {
  product: UiProduct;
  base: string;
  overlay: string;
  savedPlacement?: Placement | null;
}) {
  const [artAspect, setArtAspect] = useState(1);
  const placement = useMemo(
    () => savedPlacement ?? defaultPlacement(product, artAspect),
    [savedPlacement, product, artAspect],
  );

  return (
    <MockupStage>
      <img src={base} alt={product.nm} loading="lazy" style={STAGE_GARMENT_STYLE} />
      <img
        className="art-overlay-img"
        src={overlay}
        alt="Artwork"
        style={placementStyle(placement, artAspect)}
        onLoad={(e) => {
          const img = e.currentTarget;
          const aspect = (img.naturalHeight || 1) / (img.naturalWidth || 1);
          if (aspect > 0) setArtAspect(aspect);
        }}
      />
    </MockupStage>
  );
}

function MaskArtworkComposite({
  product,
  mask,
  overlay,
  tintHex,
  savedPlacement,
}: {
  product: UiProduct;
  mask: string;
  overlay: string;
  tintHex: string;
  savedPlacement?: Placement | null;
}) {
  const [artAspect, setArtAspect] = useState(1);
  const placement = useMemo(
    () => savedPlacement ?? defaultPlacement(product, artAspect),
    [savedPlacement, product, artAspect],
  );
  // Blend the print into the fabric so it respects the garment's shadows/texture.
  const fx = artworkFabricFx(tintHex);

  return (
    <MockupStage isolation>
      <TintedGarment src={mask} hex={tintHex} alt={product.nm} style={STAGE_GARMENT_STYLE} />
      {overlay ? (
        <img
          className="art-overlay-img"
          src={overlay}
          alt="Artwork"
          style={{
            ...placementStyle(placement, artAspect),
            opacity: fx.opacity,
            mixBlendMode: fx.mixBlendMode,
          }}
          onLoad={(e) => {
            const img = e.currentTarget;
            const aspect = (img.naturalHeight || 1) / (img.naturalWidth || 1);
            if (aspect > 0) setArtAspect(aspect);
          }}
        />
      ) : null}
    </MockupStage>
  );
}

/**
 * Live realistic tinted mockup. Whenever the colour swatch changes it bakes the
 * recoloured garment mask (multiply keeps the fabric folds/shadows) plus the
 * warped, fabric-blended artwork to a canvas — the same realistic path as the
 * saved bake — and shows the result. While the bake is in flight (or if it
 * can't run, e.g. a cross-origin mask), it falls back to the DOM mask+overlay
 * composite so there is always a live preview.
 */
function TintedMockupImage({
  product,
  overlay,
  tintHex,
  savedPlacement,
  fallback,
}: {
  product: UiProduct;
  overlay: string;
  tintHex: string;
  savedPlacement?: Placement | null;
  fallback: ReactElement;
}) {
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);
  const reqRef = useRef(0);

  useEffect(() => {
    const req = ++reqRef.current;
    setFailed(false);
    bakeTintedMockup(product, overlay, savedPlacement ?? null, tintHex)
      .then((url) => {
        if (req !== reqRef.current) return;
        if (url) setSrc(url);
        else setFailed(true);
      })
      .catch(() => {
        if (req === reqRef.current) setFailed(true);
      });
    // Keep the previous baked image visible while the next colour bakes.
  }, [product, overlay, tintHex, savedPlacement]);

  if (failed || !src) return fallback;
  return (
    <div className="img img-mockup">
      <img
        src={src}
        alt={product.nm}
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
      />
    </div>
  );
}

/**
 * Saved-design thumbnail. The baked Konva mockup (uploaded at the artwork step)
 * is the source of truth for the default look — it is preferred whenever
 * present. Live compositing remains for tinted colour variants (using the
 * saved placement so the artwork sits exactly where the user put it) and for
 * products that never got a bake.
 */
export function DesignedProductThumb({
  product,
  artworkUrl,
  tintHex,
  preferBakedMockup = true,
  className,
  style,
}: {
  product: UiProduct;
  artworkUrl?: string;
  /** Garment colour for mask-based previews (store colour picker). Omit for baked default. */
  tintHex?: string;
  /** When true, prefer the saved baked mockup unless a non-white tint is set. */
  preferBakedMockup?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const baked = resolveMediaUrl(product.mockupUrl);
  const overlay = artworkUrl ? resolveMediaUrl(artworkUrl) : "";
  const printAreaBase = resolveMediaUrl(pickPrintArea(product)?.mockupImageUrl);
  const stageBase = resolveMediaUrl(product.baseImageUrl);
  const resolvedMask = resolveMediaUrl(product.maskImageUrl);
  /** Production garment image used for live colour tinting (never the marketing photo). */
  const tintMask = resolvedMask || stageBase || printAreaBase;
  const maskStage = tintMask || resolveMediaUrl(designImgUrl(product));
  const base =
    maskStage ||
    resolveMediaUrl(product.photoUrl) ||
    productThumbUrl(product, false) ||
    productThumbUrl(product, true);

  const isDefaultTint = isDefaultMockupTint(tintHex);
  const showBaked = Boolean(baked && isDefaultTint && preferBakedMockup);
  const savedPlacement = product.placement ?? null;
  const liveTintHex = tintHex || DEFAULT_MOCKUP_TINT_HEX;

  const inner =
    showBaked ? (
      <div className="img img-mockup">
        <img
          src={baked}
          alt={product.nm}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
      </div>
    ) : !isDefaultTint && tintMask ? (
      // Colour swatch selected: bake a realistic recoloured mockup (tinted
      // garment + warped/blended artwork). Falls back to the DOM composite
      // while baking or if the canvas bake can't run.
      <TintedMockupImage
        product={product}
        overlay={overlay}
        tintHex={liveTintHex}
        savedPlacement={savedPlacement}
        fallback={
          <MaskArtworkComposite
            product={product}
            mask={tintMask}
            overlay={overlay}
            tintHex={liveTintHex}
            savedPlacement={savedPlacement}
          />
        }
      />
    ) : overlay && resolvedMask ? (
      <MaskArtworkComposite
        product={product}
        mask={resolvedMask}
        overlay={overlay}
        tintHex={liveTintHex}
        savedPlacement={savedPlacement}
      />
    ) : overlay && maskStage ? (
      <LiveArtworkComposite
        product={product}
        base={maskStage}
        overlay={overlay}
        savedPlacement={savedPlacement}
      />
    ) : baked ? (
      <div className="img img-mockup">
        <img
          src={baked}
          alt={product.nm}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
      </div>
    ) : (
      <div className={`img${base ? " img-mockup" : ""}`}>
        {base ? (
          <img
            src={base}
            alt={product.nm}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
        ) : (
          <div
            className="sm-skeleton-img"
            aria-hidden="true"
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </div>
    );

  if (!className && !style) return inner;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        ...(className === "sf-pdp-thumb" ? {} : { height: "100%" }),
        ...style,
      }}
    >
      {inner}
    </div>
  );
}

/** Map storefront product rows onto the shared mockup thumbnail shape. */
export function storeProductAsUi(p: {
  _id?: string;
  catalogProductId?: string;
  name: string;
  brand?: string;
  group?: string;
  maskImageUrl?: string;
  baseImageUrl?: string;
  mockupUrl?: string;
  placement?: UiProduct["placement"];
  printAreas?: UiProduct["printAreas"];
  primaryImageUrl?: string;
  imageUrls?: string[];
}): UiProduct {
  const catalogId =
    p.catalogProductId || (p._id?.includes(":") ? p._id.split(":").pop() : p._id) || undefined;
  const photo = resolveMediaUrl(p.primaryImageUrl) || resolveMediaUrl(p.imageUrls?.[0]) || "";
  const mask = resolveMediaUrl(p.maskImageUrl);
  const base = resolveMediaUrl(p.baseImageUrl);
  return {
    id: catalogId,
    g: p.group || "tee",
    brand: p.brand || "",
    nm: p.name,
    price: "",
    sw: 4,
    maskImageUrl: mask,
    baseImageUrl: base,
    imgUrl: mask || base,
    photoUrl: photo,
    mockupUrl: p.mockupUrl,
    placement: p.placement,
    printAreas: p.printAreas,
  };
}
