import { useMemo, useState, type CSSProperties } from "react";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { TintedGarment } from "@/components/store/TintedGarment";
import type { UiProduct } from "@/services/mappers";
import { DEFAULT_MOCKUP_TINT_HEX } from "./colors";
import {
  defaultPlacement,
  designImgUrl,
  pickPrintArea,
  productThumbUrl,
  type Placement,
} from "./mockup-bake";

function placementStyle(pl: Placement, artAspect: number): CSSProperties {
  return {
    position: "absolute",
    left: `${pl.xPct}%`,
    top: `${pl.yPct}%`,
    width: `${pl.wPct}%`,
    aspectRatio: `${1 / Math.max(artAspect, 0.01)}`,
    transform: `translate(-50%, -50%) rotate(${pl.rot || 0}deg)`,
    transformOrigin: "center center",
    objectFit: "contain",
    pointerEvents: "none",
  };
}

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
    <div className="img img-mockup" style={{ position: "relative" }}>
      <img
        src={base}
        alt={product.nm}
        loading="lazy"
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
      />
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
    </div>
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

  return (
    <div className="img img-mockup" style={{ position: "relative" }}>
      <TintedGarment
        src={mask}
        hex={tintHex}
        alt={product.nm}
        style={{ width: "100%", height: "100%" }}
      />
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
  tintHex = DEFAULT_MOCKUP_TINT_HEX,
  className,
  style,
}: {
  product: UiProduct;
  artworkUrl?: string;
  /** Garment colour for mask-based previews (store colour picker). */
  tintHex?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const baked = resolveMediaUrl(product.mockupUrl);
  const overlay = artworkUrl ? resolveMediaUrl(artworkUrl) : "";
  const printAreaBase = resolveMediaUrl(pickPrintArea(product)?.mockupImageUrl);
  const stageBase = resolveMediaUrl(product.baseImageUrl);
  const resolvedMask = resolveMediaUrl(product.maskImageUrl);
  const maskStage = resolvedMask || stageBase || printAreaBase || resolveMediaUrl(designImgUrl(product));
  const base =
    maskStage ||
    resolveMediaUrl(product.photoUrl) ||
    productThumbUrl(product, false) ||
    productThumbUrl(product, true);

  const isDefaultTint =
    !tintHex || tintHex.toLowerCase() === DEFAULT_MOCKUP_TINT_HEX.toLowerCase();
  const savedPlacement = product.placement ?? null;

  const inner =
    baked && isDefaultTint ? (
      <div className="img img-mockup">
        <img
          src={baked}
          alt={product.nm}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
      </div>
    ) : overlay && resolvedMask ? (
      <MaskArtworkComposite
        product={product}
        mask={resolvedMask}
        overlay={overlay}
        tintHex={tintHex}
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
