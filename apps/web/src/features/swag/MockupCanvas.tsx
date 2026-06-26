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

/**
 * One product's live, editable mockup: the production mask as a DOM image with
 * a Konva stage layered on top for the draggable / scalable / rotatable artwork.
 * Ported from the legacy vanilla-Konva `mountOneMockup`.
 */
export function MockupCanvas({
  product,
  artUrl,
  placement,
  onChange,
}: {
  product: UiProduct;
  artUrl: string;
  placement: Placement | undefined;
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
      layer.add(
        new Konva.Rect({
          x: bx,
          y: by,
          width: bw,
          height: bh,
          stroke: "rgba(21,120,76,.55)",
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
      const w0 = (pl.wPct / 100) * size;
      const h0 = w0 * aspect;
      const realArt = buildRealisticArtwork(artImg, product?.g);
      const node = new Konva.Image({
        image: realArt,
        x: (pl.xPct / 100) * size,
        y: (pl.yPct / 100) * size,
        width: w0,
        height: h0,
        offsetX: w0 / 2,
        offsetY: h0 / 2,
        rotation: pl.rot || 0,
        draggable: true,
        globalCompositeOperation: "multiply",
        opacity: 0.96,
      });
      layer.add(node);

      const tr = new Konva.Transformer({
        nodes: [node],
        rotateEnabled: true,
        keepRatio: true,
        enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
        rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315],
        anchorSize: 9,
        anchorStroke: "#15784C",
        borderStroke: "#15784C",
        boundBoxFunc: (o, n) => (n.width < 16 || n.height < 16 ? o : n),
      });
      layer.add(tr);

      function commit() {
        const nw = Math.max(16, node.width() * node.scaleX());
        const nh = Math.max(16, node.height() * node.scaleY());
        node.scaleX(1);
        node.scaleY(1);
        node.width(nw);
        node.height(nh);
        node.offsetX(nw / 2);
        node.offsetY(nh / 2);
        onChangeRef.current({
          xPct: (node.x() / size) * 100,
          yPct: (node.y() / size) * 100,
          wPct: (nw / size) * 100,
          rot: Math.round(node.rotation()),
        });
        tr.forceUpdate();
        layer.batchDraw();
      }
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
    // Remount when the product or artwork changes (placement read via ref).
  }, [product, artUrl]);

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
