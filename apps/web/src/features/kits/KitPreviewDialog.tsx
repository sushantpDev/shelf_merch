import { useMemo, type CSSProperties } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DesignedProductThumb } from "@/features/swag/DesignedProductThumb";
import { resolveColorHex } from "@/lib/colorMap";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { PlatformKitTemplate } from "@/services/api-bridge";
import type { UiKit, UiProduct } from "@/services/mappers";

export type KitPreviewProduct = {
  key: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  product?: UiProduct;
  variants: Array<{ size?: string; color?: string; colorHex?: string; material?: string }>;
};

export type KitPreviewData = {
  name: string;
  description: string;
  coverImage?: string;
  artworkUrl?: string;
  packaging?: string;
  products: KitPreviewProduct[];
};

type ColorOption = { name: string; hex: string };
type Availability = { colors: ColorOption[]; sizes: string[] };

function uniquePreserveOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const key = v.trim();
    if (!key) continue;
    const lower = key.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push(key);
  }
  return out;
}

function productAvailability(
  variants: KitPreviewProduct["variants"],
  product?: UiProduct,
): Availability {
  const sizeNames = uniquePreserveOrder(
    (variants || []).map((v) => v.size || "").filter(Boolean),
  );
  const colorNames = uniquePreserveOrder([
    ...(product?.colors || []),
    ...(variants || []).map((v) => v.color || "").filter(Boolean),
  ]);

  const colors: ColorOption[] = colorNames.map((name) => {
    const fromVariant = variants?.find(
      (v) => v.color?.toLowerCase() === name.toLowerCase() && v.colorHex,
    )?.colorHex;
    const fromMap = product?.colorHexByName
      ? Object.entries(product.colorHexByName).find(
          ([k]) => k.toLowerCase() === name.toLowerCase(),
        )?.[1]
      : undefined;
    return { name, hex: resolveColorHex(name, fromVariant || fromMap) };
  });

  return { colors, sizes: sizeNames };
}

function productImageUrl(product?: UiProduct): string | undefined {
  if (!product) return undefined;
  return (
    resolveMediaUrl(product.mockupUrl) ||
    resolveMediaUrl(product.photoUrl) ||
    resolveMediaUrl(product.imgUrl) ||
    undefined
  );
}

/** Build a read-only preview model from a workspace kit + catalog. */
export function buildKitPreviewFromWorkspace(
  kit: UiKit,
  catalog: UiProduct[],
  fallbackCover?: string,
): KitPreviewData {
  const byId = new Map(catalog.map((p) => [p.id, p]));
  let description = kit.description?.trim() || "";
  let coverFromMeta: string | undefined;
  try {
    if (kit.designNotes) {
      const meta = JSON.parse(kit.designNotes) as {
        description?: string;
        imageUrls?: string[];
      };
      if (!description && meta.description) description = meta.description;
      if (meta.imageUrls?.[0]) coverFromMeta = resolveMediaUrl(meta.imageUrls[0]);
    }
  } catch {
    /* ignore */
  }

  const products: KitPreviewProduct[] = (kit.productRefs ?? []).map((ref, i) => {
    const product = byId.get(ref.catalogProductId);
    return {
      key: `${ref.catalogProductId}-${i}`,
      name: ref.name || product?.nm || "Product",
      brand: ref.brand || product?.brand,
      imageUrl: productImageUrl(product),
      product,
      variants: product?.variants ?? [],
    };
  });

  return {
    name: kit.name,
    description: description || "No description available.",
    coverImage:
      (kit.artworkUrl ? resolveMediaUrl(kit.artworkUrl) : undefined) ||
      coverFromMeta ||
      fallbackCover,
    artworkUrl: kit.artworkUrl,
    packaging: kit.packaging === "box" ? "Premium box" : kit.packaging === "none" ? "No packaging" : kit.packaging,
    products,
  };
}

/** Build a read-only preview model from a curated platform template + catalog. */
export function buildKitPreviewFromPlatform(
  kit: PlatformKitTemplate,
  catalog: UiProduct[],
  fallbackCover?: string,
): KitPreviewData {
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const products: KitPreviewProduct[] = (kit.items ?? []).map((item, i) => {
    const product = byId.get(String(item.catalogProductId));
    return {
      key: `${item.catalogProductId}-${i}`,
      name: product?.nm || "Product",
      brand: product?.brand,
      imageUrl:
        productImageUrl(product) ||
        (kit.imageUrls?.[i + 1] ? resolveMediaUrl(kit.imageUrls[i + 1]) : undefined),
      product,
      variants: product?.variants ?? [],
    };
  });

  // Fall back to gallery thumbnails when catalog items are sparse.
  if (products.length === 0 && kit.imageUrls && kit.imageUrls.length > 1) {
    kit.imageUrls.slice(1).forEach((url, i) => {
      products.push({
        key: `gallery-${i}`,
        name: `Item ${i + 1}`,
        imageUrl: resolveMediaUrl(url),
        variants: [],
      });
    });
  }

  return {
    name: kit.name,
    description: kit.description?.trim() || "No description available.",
    coverImage: kit.imageUrls?.[0] ? resolveMediaUrl(kit.imageUrls[0]) : fallbackCover,
    products,
  };
}

const btnGhostStyle: CSSProperties = {
  border: "1px solid var(--line)",
  padding: "8px 24px",
  borderRadius: 6,
  fontWeight: 700,
};

const labelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "var(--gray-500)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

function ProductAvailability({
  colors,
  sizes,
}: {
  colors: ColorOption[];
  sizes: string[];
}) {
  if (!colors.length && !sizes.length) return null;

  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
      {colors.length > 0 && (
        <div>
          <div style={{ ...labelStyle, marginBottom: 6 }}>Colours</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            {colors.slice(0, 10).map((c) => (
              <span
                key={c.name}
                title={c.name}
                aria-label={c.name}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: c.hex,
                  border: "1.5px solid rgba(0,0,0,.18)",
                  display: "inline-block",
                  flexShrink: 0,
                  cursor: "default",
                }}
              />
            ))}
            {colors.length > 10 && (
              <span style={{ fontSize: 11, color: "var(--gray-500)" }}>
                +{colors.length - 10}
              </span>
            )}
          </div>
        </div>
      )}
      {sizes.length > 0 && (
        <div>
          <div style={{ ...labelStyle, marginBottom: 4 }}>Sizes</div>
          <div style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.35 }}>
            {sizes.join(" · ")}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Shared read-only kit preview used by Recent Activity, Customised Kits, and Curated Kits.
 * Actions (Send / Edit) stay outside this dialog — callers close and navigate themselves.
 */
export function KitPreviewDialog({
  data,
  open,
  onOpenChange,
}: {
  data: KitPreviewData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const productCount = data?.products.length ?? 0;
  const wide = productCount > 4;

  const productCards = useMemo(() => {
    if (!data) return [];
    return data.products.map((p) => ({
      ...p,
      availability: productAvailability(p.variants, p.product),
    }));
  }, [data]);

  return (
    <Dialog open={open && data !== null} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm-modal"
        style={{
          maxWidth: wide ? 850 : 640,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {data && (
          <div className="modal-pad" style={{ padding: "24px 32px" }}>
            {data.coverImage && (
              <div
                style={{
                  width: "100%",
                  height: 180,
                  borderRadius: 10,
                  background: "var(--gray-50)",
                  border: "1px solid var(--line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                  overflow: "hidden",
                  padding: 12,
                }}
              >
                <img
                  src={data.coverImage}
                  alt=""
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                />
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <DialogTitle
                style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: 0 }}
              >
                {data.name}
              </DialogTitle>
            </div>

            <p style={{ color: "var(--gray-500)", fontSize: 14, lineHeight: 1.5, margin: "0 0 12px" }}>
              {data.description}
            </p>
            {data.packaging ? (
              <p className="muted" style={{ fontSize: 13, margin: "0 0 20px" }}>
                Packaging: <strong style={{ color: "var(--ink)" }}>{data.packaging}</strong>
              </p>
            ) : (
              <div style={{ marginBottom: 8 }} />
            )}

            <div style={{ borderBottom: "1px solid var(--line)", marginBottom: 16 }} />

            <div style={{ marginBottom: 20 }}>
              <h4
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--gray-500)",
                  marginBottom: 12,
                }}
              >
                Included Products ({productCount})
              </h4>

              {productCards.length === 0 ? (
                <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                  No products in this kit.
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                    gap: 16,
                  }}
                >
                  {productCards.map((p) => (
                    <div
                      key={p.key}
                      style={{
                        border: "1px solid var(--line)",
                        borderRadius: 8,
                        padding: 12,
                        background: "var(--gray-50)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          aspectRatio: "1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        {p.product && data.artworkUrl ? (
                          <DesignedProductThumb product={p.product} artworkUrl={data.artworkUrl} />
                        ) : p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                          />
                        ) : (
                          <div
                            className="sm-skeleton-img"
                            aria-hidden="true"
                            style={{ width: "100%", height: "100%" }}
                          />
                        )}
                      </div>
                      <div>
                        {p.brand ? (
                          <div style={labelStyle}>{p.brand}</div>
                        ) : null}
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                          {p.name}
                        </div>
                        <ProductAvailability
                          colors={p.availability.colors}
                          sizes={p.availability.sizes}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => onOpenChange(false)}
                style={btnGhostStyle}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
