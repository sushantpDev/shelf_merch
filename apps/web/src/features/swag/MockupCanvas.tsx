import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
import type { UiProduct } from "@/services/mappers";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  MIN_EFFECTIVE_DPI,
  effectiveArtworkDpi,
  placementToStagePixels,
  stagePixelsToArtworkPlacement,
} from "@/lib/printCoords";
import {
  buildRealisticArtwork,
  designImgUrl,
  loadImageEl,
  productHasPrintArea,
  resolveMediaSrc,
  resolvePrintAreaStage,
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
 * One product's live, editable mockup: production mask as a DOM image with a
 * Konva stage for draggable artwork. Placement is stored relative to the print area.
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
  resetEpoch?: number;
  onChange: (placement: Placement) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const placementRef = useRef(placement);
  const onChangeRef = useRef(onChange);
  placementRef.current = placement;
  onChangeRef.current = onChange;
  const [dpiWarn, setDpiWarn] = useState<number | null>(null);

  const maskSrc = resolveMediaSrc(designImgUrl(product));
  const branded = productHasPrintArea(product);

  useEffect(() => {
    const host = hostRef.current;
    const wrap = wrapRef.current;
    if (!host || !wrap || !artUrl) return;
    let stage: Konva.Stage | null = null;
    let cancelled = false;

    (async () => {
      const Konva = (await import("konva")).default;
      if (cancelled || !host.isConnected) return;
      const artImg = await loadImageEl(artUrl).catch(() => null);
      if (cancelled || !artImg || !host.isConnected) return;
      const maskImg = maskSrc
        ? await loadImageEl(maskSrc, true).catch(() => null)
        : null;

      const fit = Math.min(wrap.clientWidth / CANVAS_WIDTH, wrap.clientHeight / CANVAS_HEIGHT) || 1;
      host.innerHTML = "";
      host.style.width = `${CANVAS_WIDTH}px`;
      host.style.height = `${CANVAS_HEIGHT}px`;
      host.style.transform = `scale(${fit})`;
      host.style.transformOrigin = "top left";

      stage = new Konva.Stage({ container: host, width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
      const layer = new Konva.Layer();
      stage.add(layer);

      const canvasOpts =
        maskImg && maskImg.naturalWidth > 0 && maskImg.naturalHeight > 0
          ? {
              imageNaturalWidth: maskImg.naturalWidth,
              imageNaturalHeight: maskImg.naturalHeight,
            }
          : {};
      const { stage: printStage, ph } = resolvePrintAreaStage(product, canvasOpts);
      const bx = printStage.x;
      const by = printStage.y;
      const bw = printStage.w;
      const bh = printStage.h;
      const printBox: PrintBoxPx = { bx, by, bw, bh };
      const ppi = printStage.pxPerInch;

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
      layer.add(
        new Konva.Text({
          x: bx,
          y: Math.max(0, by - 16),
          text: `${ph.widthIn.toFixed(2)}×${ph.heightIn.toFixed(2)} in`,
          fontSize: 11,
          fill: "#3D5FD9",
          listening: false,
        }),
      );

      const artNaturalWidth = artImg.naturalWidth || 0;
      const aspect = (artImg.naturalHeight || 1) / Math.max(artNaturalWidth, 1);
      let pl = placementRef.current;
      if (!pl) {
        const fitW = Math.min(bw * 0.92, (bh * 0.92) / aspect);
        pl = stagePixelsToArtworkPlacement(bx + bw / 2, by + bh / 2, fitW, 0, printStage);
        onChangeRef.current(pl);
      }

      const stagePx = placementToStagePixels(pl, printStage);
      const rot0 = stagePx.rot || 0;
      let w0 = stagePx.w;
      const maxW0 = maxFitWidth(aspect, rot0, bw, bh);
      if (w0 > maxW0) w0 = maxW0;
      let h0 = w0 * aspect;
      const center0 = clampCenter(stagePx.cx, stagePx.cy, w0, h0, rot0, printBox);
      if (
        Math.abs(center0.x - stagePx.cx) > 0.5 ||
        Math.abs(center0.y - stagePx.cy) > 0.5 ||
        Math.abs(w0 - stagePx.w) > 0.5
      ) {
        pl = stagePixelsToArtworkPlacement(center0.x, center0.y, w0, rot0, printStage);
        onChangeRef.current(pl);
      }

      const effDpi = effectiveArtworkDpi(artNaturalWidth, w0, ppi);
      setDpiWarn(effDpi > 0 && effDpi < MIN_EFFECTIVE_DPI ? Math.round(effDpi) : null);

      const realArt = buildRealisticArtwork(artImg, product?.g);
      const clipGroup = new Konva.Group({
        clipFunc: (ctx) => {
          ctx.rect(bx, by, bw, bh);
        },
      });
      const node: Konva.Image = new Konva.Image({
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
      clipGroup.add(node);
      layer.add(clipGroup);

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
        const nextEff = effectiveArtworkDpi(artNaturalWidth, nw, ppi);
        setDpiWarn(nextEff > 0 && nextEff < MIN_EFFECTIVE_DPI ? Math.round(nextEff) : null);
        onChangeRef.current(
          stagePixelsToArtworkPlacement(pos.x, pos.y, nw, Math.round(node.rotation()), printStage),
        );
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
  }, [product, artUrl, resetEpoch, maskSrc]);

  return (
    <div
      className={`img${branded ? " img-mockup" : ""}`}
      ref={wrapRef}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
        overflow: "hidden",
        background: "var(--surface-2)",
      }}
    >
      {maskSrc && (
        <img
          src={maskSrc}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
          }}
        />
      )}
      <div ref={hostRef} style={{ position: "absolute", top: 0, left: 0 }} />
      {dpiWarn != null && (
        <div
          style={{
            position: "absolute",
            left: 8,
            bottom: 8,
            zIndex: 2,
            fontSize: 11,
            background: "rgba(180,83,9,.92)",
            color: "#fff",
            padding: "4px 8px",
            borderRadius: 4,
          }}
        >
          Artwork ~{dpiWarn} DPI — aim for {MIN_EFFECTIVE_DPI}+
        </div>
      )}
    </div>
  );
}
