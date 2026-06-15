import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * Recolours a garment image to `hex`, colouring ONLY the garment and not the
 * background — works for a flat cut-out whether or not the PNG is transparent.
 *
 * A canvas step (1) removes a plain/uniform background by flood-filling from the
 * edges, then (2) multiply-tints the remaining pixels by the target colour so
 * folds/shadows are preserved. Falls back to a plain <img> when there's no hex,
 * no src, or the canvas is tainted (cross-origin without CORS).
 *
 * Note: results are best on a flat garment shot. An on-model photo will also
 * tint any non-garment pixels (skin, etc.) that survive background removal —
 * an inherent limitation of a pixel heuristic with no true cut-out.
 */
const MAX_DIM = 1000; // cap working resolution for performance
const BG_THRESHOLD = 60; // colour distance treated as "background"

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function dist(r: number, g: number, b: number, c: [number, number, number]) {
  return Math.sqrt((r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2);
}

/** Remove a uniform background (flood fill from edges), then multiply-tint. */
function recolorImageData(img: ImageData, target: [number, number, number]) {
  const { data, width: w, height: h } = img;
  const idx = (x: number, y: number) => (y * w + x) * 4;

  // Already a cut-out? If many border pixels are transparent, trust the alpha.
  let borderTransparent = 0;
  let borderCount = 0;
  for (let x = 0; x < w; x += 1) {
    for (const y of [0, h - 1]) {
      borderCount += 1;
      if (data[idx(x, y) + 3] < 16) borderTransparent += 1;
    }
  }
  const hasAlphaCutout = borderTransparent / Math.max(1, borderCount) > 0.5;

  if (!hasAlphaCutout) {
    // Background colour = average of the four corners.
    const corners = [idx(0, 0), idx(w - 1, 0), idx(0, h - 1), idx(w - 1, h - 1)];
    const bg: [number, number, number] = [0, 0, 0];
    for (const c of corners) {
      bg[0] += data[c];
      bg[1] += data[c + 1];
      bg[2] += data[c + 2];
    }
    bg[0] /= 4; bg[1] /= 4; bg[2] /= 4;

    // Flood fill from every edge pixel; clear pixels close to the bg colour.
    const stack: number[] = [];
    const seen = new Uint8Array(w * h);
    const push = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const p = y * w + x;
      if (seen[p]) return;
      seen[p] = 1;
      stack.push(x, y);
    };
    for (let x = 0; x < w; x += 1) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y += 1) { push(0, y); push(w - 1, y); }
    while (stack.length) {
      const y = stack.pop() as number;
      const x = stack.pop() as number;
      const i = idx(x, y);
      if (data[i + 3] < 16 || dist(data[i], data[i + 1], data[i + 2], bg) < BG_THRESHOLD) {
        data[i + 3] = 0;
        push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
      }
    }
  }

  // Multiply-tint remaining (garment) pixels by the target colour.
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const luma = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    data[i] = target[0] * luma;
    data[i + 1] = target[1] * luma;
    data[i + 2] = target[2] * luma;
  }
}

export function TintedGarment({
  src,
  hex,
  alt = "",
  style,
}: {
  src?: string;
  hex?: string;
  alt?: string;
  style?: CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!src || !hex) return;
    setFailed(false);
    let cancelled = false;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const scale = Math.min(1, MAX_DIM / Math.max(image.naturalWidth, image.naturalHeight));
      const w = Math.max(1, Math.round(image.naturalWidth * scale));
      const h = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(image, 0, 0, w, h);
      try {
        const data = ctx.getImageData(0, 0, w, h);
        recolorImageData(data, hexToRgb(hex));
        ctx.putImageData(data, 0, 0);
      } catch {
        setFailed(true); // tainted canvas (cross-origin w/o CORS)
      }
    };
    image.onerror = () => !cancelled && setFailed(true);
    image.src = src;
    return () => {
      cancelled = true;
    };
  }, [src, hex]);

  if (!src) {
    return (
      <div style={{ display: "grid", placeItems: "center", color: "var(--ink-3)", fontSize: 12, ...style }}>
        No image
      </div>
    );
  }
  if (!hex || failed) {
    return <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "contain", ...style }} />;
  }
  return (
    <canvas
      ref={canvasRef}
      aria-label={alt}
      style={{ width: "100%", height: "100%", objectFit: "contain", ...style }}
    />
  );
}
