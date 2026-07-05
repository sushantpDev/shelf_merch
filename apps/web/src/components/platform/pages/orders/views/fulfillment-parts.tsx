import { type ReactNode } from "react";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { TintedGarment } from "@/components/store/TintedGarment";
import type { OrderItemProduct, PrintArea, ProductVariant } from "../model";

export type OrderItem = {
  name?: string;
  sku?: string;
  qty?: number;
  unitPriceInr?: number;
  imageUrl?: string;
  artworkUrl?: string;
  variant?: { size?: string; color?: string };
  product?: OrderItemProduct | null;
};

export function matchVariantHex(
  product: OrderItemProduct | null | undefined,
  variant?: { size?: string; color?: string },
) {
  if (!product?.variants?.length || !variant) return undefined;
  const match = product.variants.find(
    (v: ProductVariant) =>
      (!variant.size || v.size === variant.size) &&
      (!variant.color || v.color?.toLowerCase() === variant.color.toLowerCase()),
  );
  return match?.colorHex;
}

/** Triggers a download of the artwork; falls back to opening it if blocked (CORS). */
export async function downloadArtwork(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  } catch {
    window.open(url, "_blank");
  }
}

export function PrintAreaPreview({
  mockup,
  areas,
  tintHex,
  artworkUrl,
}: {
  mockup: string;
  areas: PrintArea[];
  tintHex?: string;
  artworkUrl?: string;
}) {
  const resolvedMockup = resolveMediaUrl(mockup);
  const resolvedArtwork = artworkUrl ? resolveMediaUrl(artworkUrl) : "";
  const visible = areas.filter(
    (a) => !a.mockupImageUrl || resolveMediaUrl(a.mockupImageUrl) === resolvedMockup,
  );
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        background: "var(--surface-2)",
        border: "1px solid var(--line)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        <TintedGarment src={mockup} hex={tintHex} alt="Design mockup" />
      </div>
      {visible.map((a, i) => (
        <div
          key={a.key ?? i}
          style={{
            position: "absolute",
            left: `${a.box.xPct}%`,
            top: `${a.box.yPct}%`,
            width: `${a.box.widthPct}%`,
            height: `${a.box.heightPct}%`,
            // Match Konva's top-left rotation origin so the editor and this
            // preview show the print area at the same angle.
            transform: a.rotationDeg ? `rotate(${a.rotationDeg}deg)` : undefined,
            transformOrigin: "top left",
            border: resolvedArtwork
              ? "1px solid rgba(46,160,103,.5)"
              : "2px dashed rgba(46,160,103,.7)",
            background: resolvedArtwork ? "transparent" : "rgba(46,160,103,.1)",
            boxSizing: "border-box",
            pointerEvents: "none",
            display: "grid",
            placeItems: "center",
          }}
        >
          {resolvedArtwork && (
            <img
              src={resolvedArtwork}
              alt="Artwork"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          )}
          <span
            style={{
              position: "absolute",
              top: -20,
              left: 0,
              fontSize: 11,
              fontWeight: 700,
              color: "var(--ink)",
              background: "#fff",
              padding: "1px 5px",
              borderRadius: 4,
              whiteSpace: "nowrap",
            }}
          >
            {a.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Small rounded pill for order/line-item metadata. */
export function Chip({ children, mono }: { children: ReactNode; mono?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 12,
        fontWeight: 600,
        color: "var(--ink-2)",
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 999,
        padding: "3px 9px",
        whiteSpace: "nowrap",
        fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
      }}
    >
      {children}
    </span>
  );
}

/** A labelled square asset tile used in the fulfilment image strip. */
export function FulfillmentTile({
  label,
  children,
  footer,
}: {
  label: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div>
      <div className="lbl" style={{ marginBottom: 6, fontSize: 10.5, letterSpacing: ".05em" }}>
        {label}
      </div>
      <div
        style={{
          aspectRatio: "1 / 1",
          background: "var(--surface-2)",
          border: "1px solid var(--line)",
          borderRadius: 8,
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
        }}
      >
        {children}
      </div>
      {footer && <div style={{ marginTop: 8 }}>{footer}</div>}
    </div>
  );
}

/** Production print spec: one row per print area. */
export function PrintSpecTable({ areas }: { areas: PrintArea[] }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <table className="tbl" style={{ fontSize: 12.5, margin: 0 }}>
        <thead>
          <tr>
            <th>Print area</th>
            <th>Method</th>
            <th>Max size</th>
            <th>DPI</th>
          </tr>
        </thead>
        <tbody>
          {areas.map((a, i) => (
            <tr key={a.key ?? i}>
              <td style={{ fontWeight: 600 }}>{a.label}</td>
              <td style={{ textTransform: "uppercase", letterSpacing: ".03em" }}>
                {a.methods?.length ? a.methods.join(", ") : "—"}
              </td>
              <td style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                {a.maxWidthCm || a.maxHeightCm
                  ? `${a.maxWidthCm ?? "—"}×${a.maxHeightCm ?? "—"} cm`
                  : "—"}
              </td>
              <td style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                {a.dpi ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
