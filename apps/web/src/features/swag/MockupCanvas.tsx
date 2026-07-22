import { useEffect, useRef } from "react";
import type Konva from "konva";
import type { UiProduct } from "@/services/mappers";
import {
  buildRealisticArtwork,
  DEFAULT_BOX,
  designImgUrl,
  loadImageEl,
  pickPrintArea,
  productHasPrintArea,
  resolveMediaSrc,
  type Placement,
} from "./mockup-bake";

const MIN_ART_PX = 16;

type PrintBoxPx = { bx: number; by: number; bw: number; bh: number };

/** Axis-aligned half-extents of a centered rectangle after rotation. */
function rotatedHalfExtents(w: number, h: number, rotDeg: number) {
  const rad = (rotDeg * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  return {
    halfW: (w * c + h * s) / 2,
    halfH: (w * s + h * c) / 2,
  };
}

/** Largest width that still fits inside the print box at the given rotation. */
function maxFitWidth(aspect: number, rotDeg: number, bw: number, bh: number) {
  const rad = (rotDeg * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  const denomW = c + aspect * s;
  const denomH = s + aspect * c;
  const maxW = Math.min(
    denomW > 0 ? bw / denomW : bw,
    denomH > 0 ? bh / denomH : bh,
  );
  return Math.max(MIN_ART_PX, maxW);
}

/** Clamp artwork center so its rotated AABB stays inside the print box. */
function clampCenter(
  x: number,
  y: number,
  w: number,
  h: number,
  rotDeg: number,
  box: PrintBoxPx,
) {
  const { halfW, halfH } = rotatedHalfExtents(w, h, rotDeg);
  const minX = box.bx + halfW;
  const maxX = box.bx + box.bw - halfW;
  const minY = box.by + halfH;
  const maxY = box.by + box.bh - halfH;
  return {
    x: minX > maxX ? box.bx + box.bw / 2 : Math.min(maxX, Math.max(minX, x)),
    y: minY > maxY ? box.by + box.bh / 2 : Math.min(maxY, Math.max(minY, y)),
  };
}

/**
 * One product's live, editable mockup: the production mask as a DOM image with
 * a Konva stage layered on top for the draggable / scalable / rotatable artwork.
 * Ported from the legacy vanilla-Konva `mountOneMockup`.
 */
export function MockupCanvas({
  product,
  artUrl,
  placement,
  resetEpoch = 0,
  onChange,
}: {
  product: UiProduct;
  artUrl: string;
  placement: Placement | undefined;
  /** Bumps when placements are reset so Konva remounts at default positions. */
  resetEpoch?: number;
  onChange: (placement: Placement) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  // Keep the latest placement/onChange without re-running the mount effect.
  const placementRef = useRef(placement);
  const onChangeRef = useRef(onChange);
  placementRef.current = placement;
  onChangeRef.current = onChange;

  const maskSrc = resolveMediaSrc(designImgUrl(product));
  const branded = productHasPrintArea(product);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !artUrl) return;
    let stage: Konva.Stage | null = null;
    let cancelled = false;

    (async () => {
      const Konva = (await import("konva")).default;
      if (cancelled || !host.isConnected) return;
      const size = host.clientWidth || host.offsetWidth;
      if (!size) return;
      const artImg = await loadImageEl(artUrl).catch(() => null);
      if (cancelled || !artImg || !host.isConnected) return;

      host.innerHTML = "";
      stage = new Konva.Stage({ container: host, width: size, height: size });
      const layer = new Konva.Layer();
      stage.add(layer);

      const area = pickPrintArea(product);
      const box = area && area.box && area.box.widthPct ? area.box : DEFAULT_BOX;
      const bx = (box.xPct / 100) * size;
      const by = (box.yPct / 100) * size;
      const bw = (box.widthPct / 100) * size;
      const bh = (box.heightPct / 100) * size;
      const printBox: PrintBoxPx = { bx, by, bw, bh };
      layer.add(
        new Konva.Rect({
          x: bx,
          y: by,
          width: bw,
          height: bh,
          stroke: "rgba(61,95,217,.55)",
          strokeWidth: 1.5,
          dash: [5, 4],
          listening: false,
        }),
      );

      const aspect = (artImg.naturalHeight || 1) / (artImg.naturalWidth || 1);
      let pl = placementRef.current;
      if (!pl) {
        const fitW = Math.min(bw * 0.92, (bh * 0.92) / aspect);
        pl = {
          xPct: box.xPct + box.widthPct / 2,
          yPct: box.yPct + box.heightPct / 2,
          wPct: (fitW / size) * 100,
          rot: 0,
        };
        onChangeRef.current(pl);
      }

      const rot0 = pl.rot || 0;
      let w0 = (pl.wPct / 100) * size;
      const maxW0 = maxFitWidth(aspect, rot0, bw, bh);
      if (w0 > maxW0) w0 = maxW0;
      let h0 = w0 * aspect;
      const center0 = clampCenter(
        (pl.xPct / 100) * size,
        (pl.yPct / 100) * size,
        w0,
        h0,
        rot0,
        printBox,
      );
      if (
        Math.abs(center0.x - (pl.xPct / 100) * size) > 0.5 ||
        Math.abs(center0.y - (pl.yPct / 100) * size) > 0.5 ||
        Math.abs(w0 - (pl.wPct / 100) * size) > 0.5
      ) {
        pl = {
          xPct: (center0.x / size) * 100,
          yPct: (center0.y / size) * 100,
          wPct: (w0 / size) * 100,
          rot: rot0,
        };
        onChangeRef.current(pl);
      }

      const realArt = buildRealisticArtwork(artImg, product?.g);
      const node = new Konva.Image({
        image: realArt,
        x: center0.x,
        y: center0.y,
        width: w0,
        height: h0,
        offsetX: w0 / 2,
        offsetY: h0 / 2,
        rotation: rot0,
        draggable: true,
        globalCompositeOperation: "multiply",
        opacity: 0.96,
        dragBoundFunc: (pos) => {
          const w = Math.abs(node.width() * node.scaleX());
          const h = Math.abs(node.height() * node.scaleY());
          return clampCenter(pos.x, pos.y, w, h, node.rotation(), printBox);
        },
      });
      layer.add(node);

      function confineNode() {
        const rot = node.rotation();
        const maxW = maxFitWidth(aspect, rot, bw, bh);
        let w = Math.abs(node.width() * node.scaleX());
        let h = Math.abs(node.height() * node.scaleY());
        if (w > maxW) {
          const sx = maxW / Math.max(node.width(), 1e-6);
          node.scaleX(sx);
          node.scaleY(sx);
          w = maxW;
          h = maxW * aspect;
        }
        const pos = clampCenter(node.x(), node.y(), w, h, rot, printBox);
        node.position(pos);
      }

      const tr = new Konva.Transformer({
        nodes: [node],
        rotateEnabled: true,
        keepRatio: true,
        enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
        rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315],
        anchorSize: 9,
        anchorStroke: "#3D5FD9",
        borderStroke: "#3D5FD9",
        boundBoxFunc: (o, n) => {
          if (n.width < MIN_ART_PX || n.height < MIN_ART_PX) return o;
          const nAspect = n.height / Math.max(n.width, 1e-6);
          const maxW = maxFitWidth(nAspect, n.rotation, bw, bh);
          if (n.width > maxW + 0.5) return o;
          const { halfW, halfH } = rotatedHalfExtents(n.width, n.height, n.rotation);
          const cx = n.x + n.width / 2;
          const cy = n.y + n.height / 2;
          if (
            cx - halfW < bx - 0.5 ||
            cy - halfH < by - 0.5 ||
            cx + halfW > bx + bw + 0.5 ||
            cy + halfH > by + bh + 0.5
          ) {
            return o;
          }
          return n;
        },
      });
      layer.add(tr);

      function commit() {
        confineNode();
        const nw = Math.max(MIN_ART_PX, Math.abs(node.width() * node.scaleX()));
        const nh = Math.max(MIN_ART_PX, Math.abs(node.height() * node.scaleY()));
        node.scaleX(1);
        node.scaleY(1);
        node.width(nw);
        node.height(nh);
        node.offsetX(nw / 2);
        node.offsetY(nh / 2);
        const pos = clampCenter(node.x(), node.y(), nw, nh, node.rotation(), printBox);
        node.position(pos);
        onChangeRef.current({
          xPct: (pos.x / size) * 100,
          yPct: (pos.y / size) * 100,
          wPct: (nw / size) * 100,
          rot: Math.round(node.rotation()),
        });
        tr.forceUpdate();
        layer.batchDraw();
      }
      node.on("transform", () => {
        confineNode();
        tr.forceUpdate();
        layer.batchDraw();
      });
      node.on("transformend", commit);
      node.on("dragend", commit);
      stage.on("mousedown touchstart", (e) => {
        tr.nodes(e.target === stage ? [] : [node]);
        layer.batchDraw();
      });
      layer.draw();
    })();

    return () => {
      cancelled = true;
      try {
        stage?.destroy();
      } catch {
        /* noop */
      }
    };
    // Remount when the product, artwork, or placement reset epoch changes.
  }, [product, artUrl, resetEpoch]);

  return (
    <div
      className={`img${branded ? " img-mockup" : ""}`}
      style={{ position: "relative", display: "block", background: "#fff", touchAction: "none" }}
    >
      {maskSrc ? (
        <img
          src={maskSrc}
          alt={product.nm}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
      ) : (
        <div
          className="sm-skeleton-img"
          aria-hidden="true"
          style={{ width: "100%", height: "100%" }}
        />
      )}
      <div ref={hostRef} data-konva-mockup style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}
