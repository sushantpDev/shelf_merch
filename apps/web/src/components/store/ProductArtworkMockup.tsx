import { useMemo, useState, type CSSProperties } from "react";
import { resolveMediaUrl } from "@/lib/mediaUrl";

export type MockupProduct = {
  name: string;
  primaryImageUrl?: string;
  imageUrls?: string[];
  maskImageUrl?: string;
  artworkUrl?: string;
  printAreas?: Array<{
    key?: string;
    label?: string;
    mockupImageUrl?: string;
    box: { xPct: number; yPct: number; widthPct: number; heightPct: number };
    /** Optional per-area artwork (when present, drawn instead of shared artworkUrl). */
    artworkUrl?: string;
  }>;
};

function uniquePaths(urls: Array<string | undefined>) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const path = resolveMediaUrl(raw);
    if (!path || seen.has(path)) continue;
    seen.add(path);
    out.push(path);
  }
  return out;
}

function defaultImageCandidates(p: MockupProduct) {
  return uniquePaths([p.maskImageUrl, p.primaryImageUrl, ...(p.imageUrls || [])]);
}

function printAreaWrapStyle(box?: {
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
}): CSSProperties {
  if (!box?.widthPct || !box?.heightPct) {
    return {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: "34%",
      height: "34%",
      boxSizing: "border-box",
      overflow: "hidden",
      display: "grid",
      placeItems: "center",
      pointerEvents: "none",
    };
  }
  return {
    position: "absolute",
    left: `${box.xPct}%`,
    top: `${box.yPct}%`,
    width: `${box.widthPct}%`,
    height: `${box.heightPct}%`,
    boxSizing: "border-box",
    overflow: "hidden",
    display: "grid",
    placeItems: "center",
    pointerEvents: "none",
  };
}

/** Areas to draw on the active mockup image — prefer areas matching the image, else all usable. */
function areasForImage(p: MockupProduct, activeImage: string) {
  const areas = p.printAreas || [];
  if (!areas.length) return [];
  const imgNorm = resolveMediaUrl(activeImage);
  const maskNorm = resolveMediaUrl(p.maskImageUrl);
  const usable = areas.filter((a) => a?.box?.widthPct > 0 && a?.box?.heightPct > 0);
  const list = usable.length ? usable : areas;
  // If areas share this mockup (or mask), draw all of them on one image.
  const onThisImage = list.filter((a) => {
    const areaImg = resolveMediaUrl(a.mockupImageUrl);
    if (!areaImg) return true;
    if (maskNorm && areaImg === maskNorm) return true;
    if (imgNorm && areaImg === imgNorm) return true;
    return false;
  });
  if (onThisImage.length) return onThisImage;
  // Fallback: first usable area only (legacy single-overlay behaviour).
  return list.slice(0, 1);
}

export default function ProductArtworkMockup({
  product,
  imageCandidates,
  className,
  style,
}: {
  product: MockupProduct;
  imageCandidates?: string[];
  className?: string;
  style?: CSSProperties;
}) {
  const candidates = useMemo(
    () => uniquePaths(imageCandidates?.length ? imageCandidates : defaultImageCandidates(product)),
    [imageCandidates, product],
  );
  const [idx, setIdx] = useState(0);
  const img = candidates[idx] || "";
  const areas = areasForImage(product, img);
  const sharedOverlay = product.artworkUrl ? resolveMediaUrl(product.artworkUrl) : "";

  if (!img) {
    return (
      <div
        className={className}
        style={{ display: "grid", placeItems: "center", height: "100%", ...style }}
      >
        <span className="mut3" style={{ fontSize: 12 }}>
          No image
        </span>
      </div>
    );
  }

  return (
    <div className={className} style={{ position: "relative", width: "100%", height: "100%", ...style }}>
      <img
        className="mockup-base"
        src={img}
        alt={product.name}
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        onError={() => {
          if (idx + 1 < candidates.length) setIdx((i) => i + 1);
        }}
      />
      {areas.map((area, i) => {
        const overlay =
          (area.artworkUrl ? resolveMediaUrl(area.artworkUrl) : "") ||
          (i === 0 ? sharedOverlay : "");
        if (!overlay) return null;
        return (
          <div
            key={area.key || area.label || `area_${i}`}
            className="art-overlay"
            style={printAreaWrapStyle(area.box)}
          >
            <img className="art-overlay-img" src={overlay} alt="Artwork" />
          </div>
        );
      })}
      {/* Legacy: no print areas, still show shared artwork centered. */}
      {!areas.length && sharedOverlay ? (
        <div className="art-overlay" style={printAreaWrapStyle()}>
          <img className="art-overlay-img" src={sharedOverlay} alt="Artwork" />
        </div>
      ) : null}
    </div>
  );
}
