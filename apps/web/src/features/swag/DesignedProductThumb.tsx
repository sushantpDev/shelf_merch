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
}: {
  product: UiProduct;
  base: string;
  overlay: string;
}) {
  const [artAspect, setArtAspect] = useState(1);
  const placement = useMemo(() => defaultPlacement(product, artAspect), [product, artAspect]);

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
}: {
  product: UiProduct;
  mask: string;
  overlay: string;
  tintHex: string;
}) {
  const [artAspect, setArtAspect] = useState(1);
  const placement = useMemo(() => defaultPlacement(product, artAspect), [product, artAspect]);

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
 * Saved-design thumbnail: prefer a stored baked mockup when available, then a
 * live product + artwork composite, then the catalog base image.
 */
export function DesignedProductThumb({
  product,
  artworkUrl,
  className,
  style,
}: {
  product: UiProduct;
  artworkUrl?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const baked = resolveMediaUrl(product.mockupUrl);
  const overlay = artworkUrl ? resolveMediaUrl(artworkUrl) : "";
  const printAreaBase = resolveMediaUrl(pickPrintArea(product)?.mockupImageUrl);
  const stageBase = resolveMediaUrl(product.baseImageUrl);
  const resolvedMask = resolveMediaUrl(product.maskImageUrl);
  const tintHex = DEFAULT_MOCKUP_TINT_HEX;
  const maskStage = resolvedMask || stageBase || printAreaBase || resolveMediaUrl(designImgUrl(product));
  const base =
    maskStage ||
    resolveMediaUrl(product.photoUrl) ||
    productThumbUrl(product, false) ||
    productThumbUrl(product, true);

  const inner =
    overlay && resolvedMask ? (
      <MaskArtworkComposite
        product={product}
        mask={resolvedMask}
        overlay={overlay}
        tintHex={tintHex}
      />
    ) : overlay && maskStage ? (
      <LiveArtworkComposite product={product} base={maskStage} overlay={overlay} />
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
    printAreas: p.printAreas,
  };
}
