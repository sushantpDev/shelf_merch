import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { UiProduct } from "@/services/mappers";

/**
 * Compact product/design thumbnail. Prefers a pre-baked design mockup, falling
 * back to the catalog photo, then a neutral placeholder. (The full live
 * print-area compositing belongs to the Swag designer.)
 */
export function ProductThumb({
  product,
  branded = false,
}: {
  product: UiProduct;
  branded?: boolean;
}) {
  const src = branded
    ? resolveMediaUrl(product.mockupUrl) || resolveMediaUrl(product.imgUrl)
    : resolveMediaUrl(product.imgUrl) || resolveMediaUrl(product.mockupUrl);
  return (
    <div className={`img${branded ? " img-mockup" : ""}`}>
      {src ? (
        <img
          src={src}
          alt={product.nm}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
      ) : (
        <div
          className="sm-skeleton-img"
          aria-hidden="true"
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </div>
  );
}
