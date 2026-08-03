import { mediaUrlForCanvas, resolveMediaUrl } from "@/lib/mediaUrl";
import type { UiProduct } from "@/services/mappers";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_DPI,
  DEFAULT_PHYSICAL,
  designPlacementOnMockup,
  normalizePlaceholder,
  physicalFrameForView,
  placeholderToStagePixels,
  placementPrintFractions,
  printExportSize,
  resolvePhysical,
  stagePixelsToArtworkPlacement,
  type ArtworkPlacement,
  type CanvasOpts,
} from "@/lib/printCoords";

/** Per-product artwork placement — print-area % preferred; canvas % mirrored. */
export type Placement = ArtworkPlacement;

export type MockupUploadItem = {
  catalogProductId: string;
  dataUrl: string;
  placement: Placement;
  designOnlyDataUrl?: string;
  printSpec?: {
    widthIn: number;
    heightIn: number;
    dpi: number;
    widthPx: number;
    heightPx: number;
  };
};

/** Legacy fallback when a product has no inch or % print area yet. */
export const DEFAULT_BOX = { xPct: 33, yPct: 30, widthPct: 34, heightPct: 38 };

export function productPhysical(p: UiProduct | undefined) {
  return resolvePhysical(p?.physicalDimensions ?? DEFAULT_PHYSICAL);
}

export function productDpi(p: UiProduct | undefined, areaDpi?: number) {
  return Math.max(1, Number(areaDpi) || Number(p?.dpi) || DEFAULT_DPI);
}

/** Resolve placeholder inches + stage pixels for the active print area. */
export function resolvePrintAreaStage(p: UiProduct, canvasOpts: CanvasOpts = {}) {
  const area = pickPrintArea(p);
  const phys = physicalFrameForView(productPhysical(p), area?.key);
  const raw = area
    ? (area as unknown as Record<string, unknown>)
    : { box: DEFAULT_BOX, widthIn: 0, heightIn: 0 };
  const ph = normalizePlaceholder(raw, phys);
  const stage = placeholderToStagePixels(ph, phys, canvasOpts);
  return { area, phys, ph, stage, dpi: productDpi(p, area?.dpi) };
}

export function placementKey(prod: UiProduct, idx: number): string {
  return prod?.id || `idx${idx}`;
}

export function resolveMediaSrc(url: string | undefined): string {
  if (!url) return "";
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return url.startsWith("/") ? url : `/${url}`;
}

function normMediaPath(url: string | undefined): string {
  if (!url) return "";
  const path = String(url).replace(/^https?:\/\/[^/]+/i, "");
  return path.startsWith("/") ? path : `/${path}`;
}

/** Production mask used behind artwork in design previews and baked mockups (never the marketing photo). */
export function designImgUrl(p: UiProduct): string {
  return p?.maskImageUrl || p?.baseImageUrl || "";
}

/** Same-origin path compare — ignores scheme/host so catalog vs collection refs match. */
function sameMediaPath(a: string, b: string): boolean {
  if (!a || !b) return false;
  return normMediaPath(a) === normMediaPath(b);
}

/**
 * Production garment image for live colour tinting. Never returns the marketing
 * photo (`photoUrl`) — only mask, stage, print-area mockup, or imgUrl when it
 * differs from the catalog photo.
 */
export function resolveGarmentMaskUrl(p: UiProduct | undefined): string {
  if (!p) return "";
  const photo = resolveMediaUrl(p.photoUrl);
  const mask = resolveMediaUrl(p.maskImageUrl);
  if (mask) return mask;
  const base = resolveMediaUrl(p.baseImageUrl);
  if (base && !sameMediaPath(base, photo)) return base;
  const printArea = resolveMediaUrl(pickPrintArea(p)?.mockupImageUrl);
  if (printArea && !sameMediaPath(printArea, photo)) return printArea;
  const design = resolveMediaUrl(designImgUrl(p));
  if (design && !sameMediaPath(design, photo)) return design;
  const img = resolveMediaUrl(p.imgUrl);
  if (img && !sameMediaPath(img, photo)) return img;
  return "";
}

/** Pick the print area whose mockup image matches the mask/photo, else the first usable one. */
export function pickPrintArea(p: UiProduct) {
  const areas = p?.printAreas;
  if (!areas?.length) return null;
  const maskUrl = p.maskImageUrl;
  if (maskUrl) {
    const maskNorm = normMediaPath(maskUrl);
    const maskArea = areas.find((a) => normMediaPath(a.mockupImageUrl) === maskNorm);
    if (maskArea) return maskArea;
  }
  if (p.baseImageUrl) {
    const baseNorm = normMediaPath(p.baseImageUrl);
    const match = areas.find((a) => normMediaPath(a.mockupImageUrl) === baseNorm);
    if (match) return match;
  }
  return (
    areas.find((a) => (a?.widthIn ?? 0) > 0 || a?.box?.widthPct > 0) || areas[0]
  );
}

export function productHasPrintArea(p: UiProduct): boolean {
  const a = pickPrintArea(p);
  return Boolean(a && ((a.widthIn ?? 0) > 0 || a.box?.widthPct > 0));
}

/** Default artwork placement — centered in the inch print area. */
export function defaultPlacement(ep: UiProduct, artAspect = 1): Placement {
  const { stage } = resolvePrintAreaStage(ep);
  const fitW = Math.min(stage.w * 0.92, (stage.h * 0.92) / Math.max(artAspect, 0.01));
  return stagePixelsToArtworkPlacement(
    stage.x + stage.w / 2,
    stage.y + stage.h / 2,
    fitW,
    0,
    stage,
  );
}

/** Load an image for canvas compositing (CORS-safe via media proxy when needed). */
export function loadImageEl(src: string, forCanvas = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error("no src"));
      return;
    }
    const resolved = forCanvas
      ? mediaUrlForCanvas(src) || resolveMediaSrc(src)
      : resolveMediaSrc(src);
    const im = new Image();
    if (forCanvas) im.crossOrigin = "anonymous";
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = resolved;
  });
}

/* ---- POD realism: warp + fabric texture + sheen baked into the artwork ---- */
let fabricTex: HTMLCanvasElement | null = null;
function getFabricTexture(): HTMLCanvasElement {
  if (fabricTex) return fabricTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  const img = x.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 128 + (Math.random() * 44 - 22);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
    img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  x.globalAlpha = 0.05;
  x.strokeStyle = "#000";
  for (let i = 0; i < 128; i += 3) {
    x.beginPath();
    x.moveTo(0, i + 0.5);
    x.lineTo(128, i + 0.5);
    x.stroke();
  }
  x.globalAlpha = 1;
  fabricTex = c;
  return c;
}

function warpAmountFor(g: string | undefined): number {
  if (g === "mug" || g === "bottle" || g === "flask") return 1;
  if (g === "cap" || g === "beanie") return 0.5;
  return 0.3;
}

function cylMapX(u: number, k: number): number {
  const maxAng = k * 0.85;
  if (maxAng < 1e-3) return u;
  return 0.5 + (Math.sin((u - 0.5) * 2 * maxAng) / Math.sin(maxAng)) * 0.5;
}

/** Bake warp + fabric texture + sheen into the artwork (placement-independent). */
export function buildRealisticArtwork(
  artImg: HTMLImageElement,
  group: string | undefined,
): HTMLCanvasElement | HTMLImageElement {
  try {
    const maxDim = 1100;
    const nw = artImg.naturalWidth || artImg.width || 0;
    const nh = artImg.naturalHeight || artImg.height || 0;
    if (nw < 2 || nh < 2) return artImg;
    const s = Math.min(1, maxDim / Math.max(nw, nh));
    const w = Math.max(1, Math.round(nw * s));
    const h = Math.max(1, Math.round(nh * s));
    const base = document.createElement("canvas");
    base.width = w;
    base.height = h;
    const b = base.getContext("2d")!;

    const k = warpAmountFor(group);
    const amp = h * 0.045 * k;
    if (k > 0.05) {
      const strips = 80;
      for (let i = 0; i < strips; i++) {
        const u0 = i / strips;
        const u1 = (i + 1) / strips;
        const um = (i + 0.5) / strips;
        const dx0 = cylMapX(u0, k) * w;
        const dx1 = cylMapX(u1, k) * w;
        const bow = Math.sin(Math.PI * um);
        const dy = amp * bow * 0.5;
        const dh = h - amp * bow;
        b.drawImage(artImg, u0 * nw, 0, (u1 - u0) * nw, nh, dx0 - 0.5, dy, dx1 - dx0 + 1, dh);
      }
    } else {
      b.drawImage(artImg, 0, 0, w, h);
    }

    const tex = getFabricTexture();
    const tc = document.createElement("canvas");
    tc.width = w;
    tc.height = h;
    const tx = tc.getContext("2d")!;
    const pat = tx.createPattern(tex, "repeat")!;
    tx.fillStyle = pat;
    tx.fillRect(0, 0, w, h);
    tx.globalCompositeOperation = "destination-in";
    tx.drawImage(base, 0, 0);
    b.save();
    b.globalCompositeOperation = "overlay";
    b.globalAlpha = 0.18;
    b.drawImage(tc, 0, 0);
    b.restore();

    const lc = document.createElement("canvas");
    lc.width = w;
    lc.height = h;
    const lx = lc.getContext("2d")!;
    const grad = lx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "rgba(255,255,255,0.40)");
    grad.addColorStop(0.5, "rgba(255,255,255,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.26)");
    lx.fillStyle = grad;
    lx.fillRect(0, 0, w, h);
    lx.globalCompositeOperation = "destination-in";
    lx.drawImage(base, 0, 0);
    b.save();
    b.globalCompositeOperation = "overlay";
    b.globalAlpha = 0.5;
    b.drawImage(lc, 0, 0);
    b.restore();

    return base;
  } catch {
    return artImg;
  }
}

/** Resolve Konva placement for bake/upload — draft value or catalog default. */
export function resolvePlacementForBake(
  product: UiProduct,
  placements: Record<string, Placement>,
  idx: number,
): Placement {
  const key = placementKey(product, idx);
  return placements[key] ?? defaultPlacement(product);
}

/** Bake white default mockups for a picked product list (wizard generate flow). */
export async function bakeMockupsForProducts(
  pickedIndices: number[],
  catalog: UiProduct[],
  artUrl: string,
  placements: Record<string, Placement>,
): Promise<MockupUploadItem[]> {
  const baked = await Promise.all(
    pickedIndices.map(async (catalogIndex, idx) => {
      const product = catalog[catalogIndex];
      if (!product?.id) return null;
      const placement = resolvePlacementForBake(product, placements, idx);
      const [dataUrl, design] = await Promise.all([
        bakeMockup(product, artUrl, placement),
        exportDesignOnly(product, artUrl, placement),
      ]);
      if (!dataUrl) return null;
      return {
        catalogProductId: product.id,
        dataUrl,
        placement,
        ...(design.dataUrl
          ? {
              designOnlyDataUrl: design.dataUrl,
              printSpec: {
                widthIn: design.widthIn,
                heightIn: design.heightIn,
                dpi: design.dpi,
                widthPx: design.widthPx,
                heightPx: design.heightPx,
              },
            }
          : {}),
      } satisfies MockupUploadItem;
    }),
  );
  return baked.filter((m): m is MockupUploadItem => m !== null);
}

/** Flatten mask + placed artwork into one PNG data URL (preview quality). */
export async function bakeMockup(
  ep: UiProduct,
  artUrl: string,
  placement: Placement | null,
  size = 1000,
  requireProductBase = false,
): Promise<string> {
  if (!artUrl) return "";
  try {
    const maskUrl = designImgUrl(ep);
    const [maskImg, artImg] = await Promise.all([
      maskUrl ? loadImageEl(maskUrl, true).catch(() => null) : Promise.resolve(null),
      loadImageEl(artUrl, true),
    ]);
    if (requireProductBase && !maskImg) return "";
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    let mdx = 0;
    let mdy = 0;
    let mw = size;
    let mh = size;
    if (maskImg) {
      const s = Math.min(size / maskImg.naturalWidth, size / maskImg.naturalHeight);
      mw = maskImg.naturalWidth * s;
      mh = maskImg.naturalHeight * s;
      mdx = (size - mw) / 2;
      mdy = (size - mh) / 2;
      ctx.drawImage(maskImg, mdx, mdy, mw, mh);
    }

    const aspect = (artImg.naturalHeight || 1) / (artImg.naturalWidth || 1);
    const pl = placement ?? defaultPlacement(ep, aspect);
    const { ph, stage, phys } = resolvePrintAreaStage(ep);
    const realArt = buildRealisticArtwork(artImg, ep?.g);
    const rel = placementPrintFractions(pl, stage, CANVAS_WIDTH, CANVAS_HEIGHT);

    const printRect = designPlacementOnMockup({
      mockupWidthPx: mw,
      mockupHeightPx: mh,
      placeholder: ph,
      physicalDimensions: phys,
      viewKey: ph.key,
    });
    const w0 = printRect.w * rel.w;
    const h0 = w0 * aspect;
    const cx = mdx + printRect.x + rel.cx * printRect.w;
    const cy = mdy + printRect.y + rel.cy * printRect.h;

    ctx.save();
    ctx.beginPath();
    ctx.rect(mdx + printRect.x, mdy + printRect.y, printRect.w, printRect.h);
    ctx.clip();
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.96;
    ctx.translate(cx, cy);
    ctx.rotate(((rel.rot || 0) * Math.PI) / 180);
    ctx.drawImage(realArt, -w0 / 2, -h0 / 2, w0, h0);
    ctx.restore();
    return canvas.toDataURL("image/png");
  } catch {
    return "";
  }
}

/**
 * Design-only production PNG: transparent canvas sized to inches × DPI.
 * Draws artwork clipped to the print placeholder — no garment/mockup.
 */
export async function exportDesignOnly(
  ep: UiProduct,
  artUrl: string,
  placement: Placement | null,
): Promise<{
  dataUrl: string;
  widthPx: number;
  heightPx: number;
  widthIn: number;
  heightIn: number;
  dpi: number;
}> {
  const empty = { dataUrl: "", widthPx: 0, heightPx: 0, widthIn: 0, heightIn: 0, dpi: DEFAULT_DPI };
  if (!artUrl) return empty;
  try {
    const artImg = await loadImageEl(artUrl, true);
    const { ph, stage, dpi } = resolvePrintAreaStage(ep);
    const { widthPx, heightPx } = printExportSize(ph.widthIn, ph.heightIn, dpi);
    const aspect = (artImg.naturalHeight || 1) / (artImg.naturalWidth || 1);
    const pl = placement ?? defaultPlacement(ep, aspect);
    const rel = placementPrintFractions(pl, stage, CANVAS_WIDTH, CANVAS_HEIGHT);

    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = heightPx;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, widthPx, heightPx);

    const artW = rel.w * widthPx;
    const artH = artW * aspect;
    const artCx = rel.cx * widthPx;
    const artCy = rel.cy * heightPx;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, widthPx, heightPx);
    ctx.clip();
    ctx.translate(artCx, artCy);
    ctx.rotate(((rel.rot || 0) * Math.PI) / 180);
    ctx.drawImage(artImg, -artW / 2, -artH / 2, artW, artH);
    ctx.restore();

    return {
      dataUrl: canvas.toDataURL("image/png"),
      widthPx,
      heightPx,
      widthIn: ph.widthIn,
      heightIn: ph.heightIn,
      dpi,
    };
  } catch {
    return empty;
  }
}

/**
 * Live realistic mockup recoloured to a garment colour. Recolours the
 * transparent production mask to `tintHex` (multiply keeps the fabric's
 * folds/shadows, then clip back to the mask alpha so the background stays
 * clear) and bakes the warped/blended artwork on top — the same realistic
 * path as bakeMockup, but tinted per colour swatch. Returns "" when there is
 * no usable garment mask to recolour.
 */
export async function bakeTintedMockup(
  ep: UiProduct,
  artUrl: string,
  placement: Placement | null,
  tintHex: string,
  size = 1000,
): Promise<string> {
  const maskUrl = designImgUrl(ep);
  if (!maskUrl || !tintHex) return "";
  try {
    const [maskImg, artImg] = await Promise.all([
      loadImageEl(maskUrl, true),
      artUrl ? loadImageEl(artUrl, true).catch(() => null) : Promise.resolve(null),
    ]);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // ── Garment: draw the mask, multiply the colour in (keeps fabric shading),
    //    then clip back to the mask alpha so only the garment is recoloured.
    const s = Math.min(size / maskImg.naturalWidth, size / maskImg.naturalHeight);
    const w = maskImg.naturalWidth * s;
    const h = maskImg.naturalHeight * s;
    const dx = (size - w) / 2;
    const dy = (size - h) / 2;
    ctx.drawImage(maskImg, dx, dy, w, h);

    // A production mask is a transparent cutout. If the source has an opaque
    // background (a marketing/model photo, not a real mask), a multiply tint
    // would recolour the whole background — so bail and let the caller fall
    // back to the DOM TintedGarment, which flood-fills the background away
    // before recolouring. Sample the four image corners for opacity.
    let opaqueCorners = 0;
    try {
      const alphaAt = (x: number, y: number) =>
        ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data[3];
      const corners: Array<[number, number]> = [
        [dx + 2, dy + 2],
        [dx + w - 3, dy + 2],
        [dx + 2, dy + h - 3],
        [dx + w - 3, dy + h - 3],
      ];
      for (const [x, y] of corners) if (alphaAt(x, y) > 200) opaqueCorners += 1;
    } catch {
      return "";
    }
    if (opaqueCorners >= 3) return "";

    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = tintHex;
    ctx.fillRect(dx, dy, w, h);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(maskImg, dx, dy, w, h);
    ctx.restore();

    // ── Artwork: warped + fabric-blended, multiplied onto the tinted garment.
    if (artImg) {
      const aspect = (artImg.naturalHeight || 1) / (artImg.naturalWidth || 1);
      const pl = placement ?? defaultPlacement(ep, aspect);
      const realArt = buildRealisticArtwork(artImg, ep?.g);
      const { ph, stage, phys } = resolvePrintAreaStage(ep);
      const rel = placementPrintFractions(pl, stage, CANVAS_WIDTH, CANVAS_HEIGHT);
      const printRect = designPlacementOnMockup({
        mockupWidthPx: w,
        mockupHeightPx: h,
        placeholder: ph,
        physicalDimensions: phys,
        viewKey: ph.key,
      });
      const w0 = printRect.w * rel.w;
      const h0 = w0 * aspect;
      const cx = dx + printRect.x + rel.cx * printRect.w;
      const cy = dy + printRect.y + rel.cy * printRect.h;
      ctx.save();
      ctx.beginPath();
      ctx.rect(dx + printRect.x, dy + printRect.y, printRect.w, printRect.h);
      ctx.clip();
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = 0.96;
      ctx.translate(cx, cy);
      ctx.rotate(((rel.rot || 0) * Math.PI) / 180);
      ctx.drawImage(realArt, -w0 / 2, -h0 / 2, w0, h0);
      ctx.restore();
    }
    return canvas.toDataURL("image/png");
  } catch {
    return "";
  }
}

/** Resolved photo/mockup thumbnail for a product or baked design. */
export function productThumbUrl(p: UiProduct, branded = false): string {
  if (branded && p.mockupUrl) return resolveMediaUrl(p.mockupUrl) || "";
  return resolveMediaUrl(p.imgUrl) || resolveMediaUrl(p.mockupUrl) || "";
}
