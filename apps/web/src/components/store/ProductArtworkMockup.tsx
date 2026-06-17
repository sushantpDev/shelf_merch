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

function pickPrintArea(p: MockupProduct, activeImage: string) {
  const areas = p.printAreas;
  if (!areas?.length) return null;
  const imgNorm = resolveMediaUrl(activeImage);
  const maskNorm = resolveMediaUrl(p.maskImageUrl);
  if (maskNorm) {
    const maskArea = areas.find((a) => resolveMediaUrl(a.mockupImageUrl) === maskNorm);
    if (maskArea) return maskArea;
  }
  if (imgNorm) {
    const match = areas.find((a) => resolveMediaUrl(a.mockupImageUrl) === imgNorm);
    if (match) return match;
  }
  return areas.find((a) => a?.box?.widthPct > 0 && a?.box?.heightPct > 0) || areas[0] || null;
}

function printAreaWrapStyle(box?: { xPct: number; yPct: number; widthPct: number; heightPct: number }): CSSProperties {
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
  const area = pickPrintArea(product, img);
  const overlay = product.artworkUrl ? resolveMediaUrl(product.artworkUrl) : "";

  if (!img) {
    return (
      <div className={className} style={{ display: "grid", placeItems: "center", height: "100%", ...style }}>
        <span className="mut3" style={{ fontSize: 12 }}>No image</span>
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
      {overlay && (
        <div className="art-overlay" style={printAreaWrapStyle(area?.box)}>
          <img className="art-overlay-img" src={overlay} alt="Artwork" />
        </div>
      )}
    </div>
  );
}
