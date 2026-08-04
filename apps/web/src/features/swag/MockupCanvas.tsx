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
  areaPlacementKey,
  buildRealisticArtwork,
  designImgUrl,
  listPrintAreas,
  loadImageEl,
  placementKey,
  primaryAreaKey,
  printAreaStableKey,
  productHasPrintArea,
  resolveMediaSrc,
  resolvePrintAreaStage,
  type Placement,
} from "./mockup-bake";

const MIN_ART_PX = 16;
const BRAND = "#3D5FD9";

type PrintBoxPx = { bx: number; by: number; bw: number; bh: number };

/** One print-area layer on the shared mockup image. */
export type MockupAreaLayer = {
  areaKey: string;
  label: string;
  artUrl?: string;
  placement?: Placement;
};

function rotatedHalfExtents(w: number, h: number, rotDeg: number) {
  const rad = (rotDeg * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  return {
    halfW: (w * c + h * s) / 2,
    halfH: (w * s + h * c) / 2,
  };
}

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

function layersSignature(layers: MockupAreaLayer[]): string {
  // Art URLs + area keys only — placements update via Konva; remounting would kill drag.
  return layers.map((l) => `${l.areaKey}:${l.artUrl || ""}`).join("|");
}

/**
 * Live mockup: garment mask + all print-area placeholders on one image.
 * Active area artwork is editable; other areas show placed art read-only.
 */
export function MockupCanvas({
  product,
  layers: layersProp,
  artUrl,
  placement,
  printAreaKey,
  activeAreaKey: activeAreaKeyProp,
  resetEpoch = 0,
  onChange,
  onSelectArea,
}: {
  product: UiProduct;
  /** All print areas to draw on this image. When omitted, falls back to single-area props. */
  layers?: MockupAreaLayer[];
  artUrl?: string;
  placement?: Placement;
  printAreaKey?: string | null;
  activeAreaKey?: string | null;
  resetEpoch?: number;
  onChange?: (placement: Placement, areaKey: string) => void;
  onSelectArea?: (areaKey: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const onSelectRef = useRef(onSelectArea);
  const layersRef = useRef(layersProp);
  onChangeRef.current = onChange;
  onSelectRef.current = onSelectArea;
  layersRef.current = layersProp;
  const [dpiWarn, setDpiWarn] = useState<number | null>(null);

  const maskSrc = resolveMediaSrc(designImgUrl(product));
  const branded = productHasPrintArea(product);

  const layers: MockupAreaLayer[] =
    layersProp && layersProp.length
      ? layersProp
      : [
          {
            areaKey: printAreaKey || "area_1",
            label: printAreaKey || "Area 1",
            artUrl,
            placement,
          },
        ];

  const activeAreaKey = activeAreaKeyProp || printAreaKey || (layersProp?.length ? undefined : layers[0]?.areaKey);
  const sig = layersSignature(layers);

  useEffect(() => {
    const host = hostRef.current;
    const wrap = wrapRef.current;
    if (!host || !wrap) return;
    let stage: Konva.Stage | null = null;
    let cancelled = false;

    const currentLayers: MockupAreaLayer[] =
      layersRef.current && layersRef.current.length
        ? layersRef.current
        : [
            {
              areaKey: printAreaKey || "area_1",
              label: printAreaKey || "Area 1",
              artUrl,
              placement,
            },
          ];

    (async () => {
      const Konva = (await import("konva")).default;
      if (cancelled || !host.isConnected) return;

      const maskImg = maskSrc
        ? await loadImageEl(maskSrc, true).catch(() => null)
        : null;
      if (cancelled || !host.isConnected) return;

      const artEntries = await Promise.all(
        currentLayers.map(async (l) => ({
          ...l,
          artImg: l.artUrl ? await loadImageEl(l.artUrl).catch(() => null) : null,
        })),
      );
      if (cancelled || !host.isConnected) return;

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

      type AreaGeom = {
        areaKey: string;
        label: string;
        printStage: ReturnType<typeof resolvePrintAreaStage>["stage"];
        ph: ReturnType<typeof resolvePrintAreaStage>["ph"];
        box: PrintBoxPx;
        ppi: number;
        artImg: HTMLImageElement | HTMLCanvasElement | null;
        placement?: Placement;
      };

      const geoms: AreaGeom[] = artEntries.map((entry) => {
        const resolved = resolvePrintAreaStage(product, canvasOpts, entry.areaKey);
        return {
          areaKey: entry.areaKey,
          label: entry.label,
          printStage: resolved.stage,
          ph: resolved.ph,
          box: {
            bx: resolved.stage.x,
            by: resolved.stage.y,
            bw: resolved.stage.w,
            bh: resolved.stage.h,
          },
          ppi: resolved.stage.pxPerInch,
          artImg: entry.artImg,
          placement: entry.placement,
        };
      });

      // Draw all placeholder boxes first (inactive under art).
      for (const g of geoms) {
        const isActive = g.areaKey === activeAreaKey;
        layer.add(
          new Konva.Rect({
            x: g.box.bx,
            y: g.box.by,
            width: g.box.bw,
            height: g.box.bh,
            stroke: isActive ? BRAND : "rgba(61,95,217,.4)",
            strokeWidth: isActive ? 2 : 1.25,
            dash: [5, 4],
            fill: isActive ? "rgba(61,95,217,.06)" : "transparent",
            listening: true,
            name: `box:${g.areaKey}`,
          }),
        );
        layer.add(
          new Konva.Text({
            x: g.box.bx,
            y: Math.max(0, g.box.by - 16),
            text: `${g.label} · ${g.ph.widthIn.toFixed(2)}×${g.ph.heightIn.toFixed(2)} in`,
            fontSize: 11,
            fill: isActive ? BRAND : "rgba(61,95,217,.75)",
            fontStyle: isActive ? "bold" : "normal",
            listening: false,
          }),
        );
      }

      let activeNode: Konva.Image | null = null;
      let activeGeom: AreaGeom | null = null;
      let activeAspect = 1;
      let activeNaturalW = 0;
      let transformer: Konva.Transformer | null = null;

      for (const g of geoms) {
        if (!g.artImg) continue;
        const isActive = g.areaKey === activeAreaKey;
        const { bx, by, bw, bh } = g.box;
        const artNaturalWidth = (g.artImg as HTMLImageElement).naturalWidth || g.artImg.width || 0;
        const aspect =
          ((g.artImg as HTMLImageElement).naturalHeight || g.artImg.height || 1) /
          Math.max(artNaturalWidth, 1);

        let pl = g.placement;
        if (!pl) {
          const fitW = Math.min(bw * 0.92, (bh * 0.92) / aspect);
          pl = stagePixelsToArtworkPlacement(bx + bw / 2, by + bh / 2, fitW, 0, g.printStage);
          if (isActive) onChangeRef.current?.(pl, g.areaKey);
        }

        const stagePx = placementToStagePixels(pl, g.printStage);
        const rot0 = stagePx.rot || 0;
        let w0 = stagePx.w;
        const maxW0 = maxFitWidth(aspect, rot0, bw, bh);
        if (w0 > maxW0) w0 = maxW0;
        let h0 = w0 * aspect;
        const center0 = clampCenter(stagePx.cx, stagePx.cy, w0, h0, rot0, g.box);
        if (
          isActive &&
          (Math.abs(center0.x - stagePx.cx) > 0.5 ||
            Math.abs(center0.y - stagePx.cy) > 0.5 ||
            Math.abs(w0 - stagePx.w) > 0.5)
        ) {
          pl = stagePixelsToArtworkPlacement(center0.x, center0.y, w0, rot0, g.printStage);
          onChangeRef.current?.(pl, g.areaKey);
        }

        if (isActive) {
          const effDpi = effectiveArtworkDpi(artNaturalWidth, w0, g.ppi);
          setDpiWarn(effDpi > 0 && effDpi < MIN_EFFECTIVE_DPI ? Math.round(effDpi) : null);
        }

        const realArt = buildRealisticArtwork(g.artImg as HTMLImageElement, product?.g);
        const clipGroup = new Konva.Group({
          clipFunc: (ctx) => {
            ctx.rect(bx, by, bw, bh);
          },
          name: `clip:${g.areaKey}`,
        });
        const node = new Konva.Image({
          image: realArt,
          x: center0.x,
          y: center0.y,
          width: w0,
          height: h0,
          offsetX: w0 / 2,
          offsetY: h0 / 2,
          rotation: rot0,
          draggable: isActive,
          listening: isActive,
          globalCompositeOperation: "multiply",
          opacity: isActive ? 0.96 : 0.9,
          name: `art:${g.areaKey}`,
          dragBoundFunc: isActive
            ? (pos) => {
                const w = Math.abs(node.width() * node.scaleX());
                const h = Math.abs(node.height() * node.scaleY());
                return clampCenter(pos.x, pos.y, w, h, node.rotation(), g.box);
              }
            : undefined,
        });
        clipGroup.add(node);
        layer.add(clipGroup);

        if (isActive) {
          activeNode = node;
          activeGeom = g;
          activeAspect = aspect;
          activeNaturalW = artNaturalWidth;
        }
      }

      if (activeNode && activeGeom) {
        const node = activeNode;
        const g = activeGeom;
        const { bx, by, bw, bh } = g.box;
        const aspect = activeAspect;

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
          const pos = clampCenter(node.x(), node.y(), w, h, rot, g.box);
          node.position(pos);
        }

        transformer = new Konva.Transformer({
          nodes: [node],
          rotateEnabled: true,
          keepRatio: true,
          enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
          rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315],
          anchorSize: 9,
          anchorStroke: BRAND,
          borderStroke: BRAND,
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
        layer.add(transformer);

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
          const pos = clampCenter(node.x(), node.y(), nw, nh, node.rotation(), g.box);
          node.position(pos);
          const nextEff = effectiveArtworkDpi(activeNaturalW, nw, g.ppi);
          setDpiWarn(nextEff > 0 && nextEff < MIN_EFFECTIVE_DPI ? Math.round(nextEff) : null);
          onChangeRef.current?.(
            stagePixelsToArtworkPlacement(pos.x, pos.y, nw, Math.round(node.rotation()), g.printStage),
            g.areaKey,
          );
          transformer?.forceUpdate();
          layer.batchDraw();
        }
        node.on("transform", () => {
          confineNode();
          transformer?.forceUpdate();
          layer.batchDraw();
        });
        node.on("transformend", commit);
        node.on("dragend", commit);
      } else {
        setDpiWarn(null);
      }

      stage.on("mousedown touchstart", (e) => {
        const name = String(e.target.name?.() || "");
        const boxMatch = name.match(/^box:(.+)$/);
        const artMatch = name.match(/^art:(.+)$/);
        const selectedKey = boxMatch?.[1] || artMatch?.[1];
        if (selectedKey && selectedKey !== activeAreaKey) {
          onSelectRef.current?.(selectedKey);
          return;
        }
        if (transformer && activeNode) {
          transformer.nodes(e.target === stage || boxMatch ? [] : [activeNode]);
          layer.batchDraw();
        }
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
  }, [product, sig, resetEpoch, maskSrc, activeAreaKey]);

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
          Active area ~{dpiWarn} DPI — aim for {MIN_EFFECTIVE_DPI}+
        </div>
      )}
    </div>
  );
}

/** Build MockupAreaLayer list from catalog print areas + draft arts/placements. */
export function buildMockupLayers(
  product: UiProduct,
  args: {
    idx: number;
    areaArts: Record<string, { preview?: string }>;
    placements: Record<string, Placement>;
    stagingPreview?: string;
    activeAreaKey?: string;
  },
): MockupAreaLayer[] {
  const areas = listPrintAreas(product);
  const list = areas.length ? areas : [null];
  const primary = primaryAreaKey(product);
  const productKey = placementKey(product, args.idx);
  return list.map((a, i) => {
    const areaKey = printAreaStableKey(a, i);
    const draftKey = areaPlacementKey(product, args.idx, areaKey);
    const artUrl =
      args.areaArts[draftKey]?.preview ||
      (areaKey === args.activeAreaKey ? args.stagingPreview : undefined) ||
      undefined;
    const placement =
      args.placements[draftKey] ??
      (areaKey === primary ? args.placements[productKey] : undefined);
    return {
      areaKey,
      label: a?.label || `Area ${i + 1}`,
      artUrl,
      placement,
    };
  });
}
