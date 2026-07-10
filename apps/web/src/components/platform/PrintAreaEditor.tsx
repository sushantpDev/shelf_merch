import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Konva from "konva";
import { Stage, Layer, Rect, Transformer, Label, Tag, Text } from "react-konva";
import type { PrintArea } from "@/services/platform-api";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { TintedGarment } from "../store/TintedGarment";

export const CUSTOMIZATION_METHODS = [
  "screen_print",
  "dtf",
  "embroidery",
  "engraving",
  "sublimation",
  "uv_print",
] as const;

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

const DEFAULT_BOX = { xPct: 30, yPct: 30, widthPct: 40, heightPct: 30 };
const SNAP = 6; // px snap distance to the centre lines
const MIN_PX = 16; // minimum print-area size in px

const BRAND = "#3D5FD9";

/**
 * POD-style design-placeholder editor. The recoloured garment is an HTML layer;
 * a transparent Konva stage overlays it so each print area is a Rect with a
 * shared Transformer — drag, resize and ROTATE, with centre snapping and
 * keyboard nudge/delete. Geometry is stored as % (+ rotationDeg) so it stays
 * resolution-independent and matches the backend printAreas schema.
 */
export function PrintAreaEditor({
  images,
  maskImageUrl,
  colors = [],
  value,
  onChange,
}: {
  images: string[];
  /** Garment mask PNG — colour preview always tints this, not the base photo. */
  maskImageUrl?: string;
  colors?: { name: string; hex: string }[];
  value: PrintArea[];
  onChange: (areas: PrintArea[]) => void;
}) {
  const resolvedImages = images.map((u) => resolveMediaUrl(u)).filter(Boolean);
  const resolvedMask = maskImageUrl ? resolveMediaUrl(maskImageUrl) : resolvedImages[resolvedImages.length - 1] ?? "";
  const [mockup, setMockup] = useState(resolvedImages[resolvedImages.length - 1] ?? "");
  const [tintHex, setTintHex] = useState("");
  const [selected, setSelected] = useState(0);
  const [size, setSize] = useState(0);

  const wrapRef = useRef<HTMLDivElement>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const rectRefs = useRef<(Konva.Rect | null)[]>([]);

  // Track the rendered (square) pixel size so we can map px <-> %.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setSize(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Prefer the mask image (last in wizard order) for colour preview.
  useEffect(() => {
    if (!resolvedImages.length) return;
    setMockup((cur) => (resolvedImages.includes(cur) ? cur : resolvedImages[resolvedImages.length - 1]));
  }, [resolvedImages.join("|")]);

  const update = (index: number, patch: Partial<PrintArea>) =>
    onChange(value.map((a, i) => (i === index ? { ...a, ...patch } : a)));

  const isVisible = (a: PrintArea) => !a.mockupImageUrl || resolveMediaUrl(a.mockupImageUrl) === mockup;

  // Attach the transformer to the selected, visible rect.
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const node = rectRefs.current[selected];
    if (node && value[selected] && isVisible(value[selected])) {
      tr.nodes([node]);
    } else {
      tr.nodes([]);
    }
    tr.getLayer()?.batchDraw();
  }, [selected, value, size, mockup]);

  function addArea() {
    const n = value.length + 1;
    onChange([
      ...value,
      {
        key: `area_${n}`,
        label: `Area ${n}`,
        mockupImageUrl: mockup,
        box: { ...DEFAULT_BOX },
        rotationDeg: 0,
        maxWidthCm: 28,
        maxHeightCm: 35,
        dpi: 300,
        methods: ["dtf"],
      },
    ]);
    setSelected(value.length);
  }

  // px geometry of an area's box on the current stage.
  const pxBox = (a: PrintArea) => ({
    x: (a.box.xPct / 100) * size,
    y: (a.box.yPct / 100) * size,
    w: (a.box.widthPct / 100) * size,
    h: (a.box.heightPct / 100) * size,
  });

  function commitNode(i: number, node: Konva.Rect) {
    const w = Math.max(MIN_PX, node.width() * node.scaleX());
    const h = Math.max(MIN_PX, node.height() * node.scaleY());
    node.scaleX(1);
    node.scaleY(1);
    node.width(w);
    node.height(h);
    update(i, {
      box: {
        xPct: (node.x() / size) * 100,
        yPct: (node.y() / size) * 100,
        widthPct: (w / size) * 100,
        heightPct: (h / size) * 100,
      },
      rotationDeg: Math.round(node.rotation()),
    });
  }

  // Snap the (unrotated) rect's centre to the stage centre lines while dragging.
  function snapDrag(node: Konva.Rect) {
    if (node.rotation() !== 0) return; // skip snapping when rotated
    const cx = node.x() + node.width() / 2;
    const cy = node.y() + node.height() / 2;
    if (Math.abs(cx - size / 2) < SNAP) node.x(size / 2 - node.width() / 2);
    if (Math.abs(cy - size / 2) < SNAP) node.y(size / 2 - node.height() / 2);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const a = value[selected];
    if (!a || !isVisible(a)) return;
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onChange(value.filter((_, i) => i !== selected));
      setSelected(0);
      return;
    }
    const stepPct = (e.shiftKey ? 5 : 1);
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-stepPct, 0], ArrowRight: [stepPct, 0], ArrowUp: [0, -stepPct], ArrowDown: [0, stepPct],
    };
    const m = moves[e.key];
    if (m) {
      e.preventDefault();
      update(selected, {
        box: {
          ...a.box,
          xPct: Math.min(100 - a.box.widthPct, Math.max(0, a.box.xPct + m[0])),
          yPct: Math.min(100 - a.box.heightPct, Math.max(0, a.box.yPct + m[1])),
        },
      });
    }
  }

  const area = value[selected];
  const displaySrc = mockup || resolvedMask;

  return (
    <div className="row" style={{ gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 360px", minWidth: 320 }}>
        {resolvedImages.length > 1 && (
          <div className="field">
            <label className="lbl">Mockup image</label>
            <select className="inp" value={mockup} onChange={(e) => setMockup(e.target.value)}>
              {resolvedImages.map((url) => (
                <option key={url} value={url}>
                  {url.split("/").pop()}
                </option>
              ))}
            </select>
          </div>
        )}
        {colors.length > 0 && displaySrc && (
          <div className="field">
            <label className="lbl">Preview colour</label>
            <p className="muted" style={{ fontSize: 12, margin: "0 0 8px" }}>
              Recolours the garment only — background stays transparent.
            </p>
            <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
              <button type="button" className={tintHex === "" ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"} onClick={() => setTintHex("")}>None</button>
              {colors.map((c) => (
                <button
                  key={c.hex + c.name}
                  type="button"
                  title={c.name}
                  onClick={() => setTintHex(c.hex)}
                  style={{ width: 26, height: 26, borderRadius: 6, background: c.hex, cursor: "pointer", border: tintHex === c.hex ? "2px solid var(--brand)" : "1px solid var(--line)" }}
                />
              ))}
            </div>
          </div>
        )}

        <div
          ref={wrapRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1 / 1",
            background: "var(--surface-2)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            overflow: "hidden",
            outline: "none",
          }}
        >
          {displaySrc ? (
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              <TintedGarment src={displaySrc} hex={tintHex} alt="mockup" />
            </div>
          ) : (
            <div className="muted" style={{ display: "grid", placeItems: "center", height: "100%" }}>
              Upload an image first
            </div>
          )}

          {size > 0 && displaySrc && (
            <Stage
              width={size}
              height={size}
              style={{ position: "absolute", inset: 0 }}
              onMouseDown={(e) => {
                // Click on empty stage area: keep current selection but blur transformer.
                if (e.target === e.target.getStage()) wrapRef.current?.focus();
              }}
            >
              <Layer>
                {value.map((a, i) => {
                  if (!isVisible(a)) {
                    rectRefs.current[i] = null;
                    return null;
                  }
                  const b = pxBox(a);
                  const isSel = i === selected;
                  return (
                    <Rect
                      key={i}
                      ref={(node) => {
                        rectRefs.current[i] = node;
                      }}
                      x={b.x}
                      y={b.y}
                      width={b.w}
                      height={b.h}
                      rotation={a.rotationDeg ?? 0}
                      draggable
                      stroke={isSel ? BRAND : "rgba(0,0,0,.45)"}
                      strokeWidth={isSel ? 2 : 1.5}
                      dash={isSel ? undefined : [5, 4]}
                      fill={isSel ? "rgba(61,95,217,.12)" : "rgba(0,0,0,.04)"}
                      onMouseDown={() => setSelected(i)}
                      onTap={() => setSelected(i)}
                      onDragMove={(e) => snapDrag(e.target as Konva.Rect)}
                      onDragEnd={(e) => {
                        setSelected(i);
                        commitNode(i, e.target as Konva.Rect);
                      }}
                      onTransformEnd={(e) => commitNode(i, e.target as Konva.Rect)}
                    />
                  );
                })}

                {/* Labels above each visible area. */}
                {value.map((a, i) => {
                  if (!isVisible(a)) return null;
                  const b = pxBox(a);
                  return (
                    <Label key={`lbl-${i}`} x={b.x} y={Math.max(0, b.y - 18)} rotation={a.rotationDeg ?? 0} listening={false}>
                      <Tag fill="#fff" stroke="var(--line)" cornerRadius={3} />
                      <Text text={a.label} fontSize={11} fontStyle="bold" padding={3} fill="#1c1c1c" />
                    </Label>
                  );
                })}

                <Transformer
                  ref={trRef}
                  rotateEnabled
                  keepRatio={false}
                  rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                  anchorSize={9}
                  anchorStroke={BRAND}
                  borderStroke={BRAND}
                  boundBoxFunc={(oldBox, newBox) =>
                    newBox.width < MIN_PX || newBox.height < MIN_PX ? oldBox : newBox
                  }
                />
              </Layer>
            </Stage>
          )}
        </div>

        <div className="row" style={{ gap: 8, marginTop: 12, alignItems: "center" }}>
          <button type="button" className="btn btn-soft btn-sm" onClick={addArea}>
            + Add print area
          </button>
          <span className="muted" style={{ fontSize: 12 }}>
            Drag to move · corner handles to resize · top handle to rotate · arrows to nudge · Del to remove
          </span>
        </div>
      </div>

      <div style={{ flex: "1 1 300px", minWidth: 280 }}>
        {!value.length && <p className="muted">No print areas yet. Add one to define where artwork can be placed.</p>}
        {area && (
          <div className="card" style={{ padding: 16 }}>
            <div className="field">
              <label className="lbl">Label</label>
              <input
                className="inp"
                value={area.label}
                onChange={(e) => update(selected, { label: e.target.value, key: slug(e.target.value) })}
              />
            </div>
            <div className="row" style={{ gap: 10 }}>
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl">Max width (cm)</label>
                <input
                  className="inp"
                  type="number"
                  value={area.maxWidthCm ?? 0}
                  onChange={(e) => update(selected, { maxWidthCm: Number(e.target.value) })}
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl">Max height (cm)</label>
                <input
                  className="inp"
                  type="number"
                  value={area.maxHeightCm ?? 0}
                  onChange={(e) => update(selected, { maxHeightCm: Number(e.target.value) })}
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl">DPI</label>
                <input
                  className="inp"
                  type="number"
                  value={area.dpi ?? 300}
                  onChange={(e) => update(selected, { dpi: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="field">
              <label className="lbl">Rotation (°)</label>
              <input
                className="inp"
                type="number"
                value={Math.round(area.rotationDeg ?? 0)}
                onChange={(e) => update(selected, { rotationDeg: Number(e.target.value) })}
              />
            </div>
            <div className="field">
              <label className="lbl">Allowed methods</label>
              <div className="row" style={{ flexWrap: "wrap", gap: 0 }}>
                {CUSTOMIZATION_METHODS.map((m) => {
                  const on = (area.methods ?? []).includes(m);
                  return (
                    <button
                      type="button"
                      key={m}
                      className="chip"
                      style={on ? { borderColor: "var(--brand)", color: "var(--brand-d)" } : undefined}
                      onClick={() =>
                        update(selected, {
                          methods: on
                            ? (area.methods ?? []).filter((x) => x !== m)
                            : [...(area.methods ?? []), m],
                        })
                      }
                    >
                      {m.replace(/_/g, " ")}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                onChange(value.filter((_, i) => i !== selected));
                setSelected(0);
              }}
            >
              Remove this area
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
