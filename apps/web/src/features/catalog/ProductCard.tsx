import { Link } from "react-router";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { UiProduct } from "@/services/mappers";

// The legacy catalog card renders a fixed swatch strip plus a "+N" colour count.
const SWATCH_DOTS = ["#1c1c1c", "#2b4a8b", "#9a9a9a", "#7a4a25"];

function thumb(p: UiProduct): string | undefined {
  return resolveMediaUrl(p.mockupUrl) || resolveMediaUrl(p.photoUrl) || resolveMediaUrl(p.imgUrl);
}

/** Catalog/browse product card — faithful to the legacy `pcard()` markup. */
export function ProductCard({ product }: { product: UiProduct }) {
  const src = thumb(product);
  const content = (
    <>
      <div className="img">
        {src ? (
          <img
            src={src}
            alt={product.nm}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          <div
            className="sm-skeleton-img"
            aria-hidden="true"
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </div>
      <div className="meta">
        {product.brand && <div className="brand">{product.brand}</div>}
        <div className="nm">{product.nm}</div>
        {product.price && <div className="pr">{product.price}</div>}
        {product.sw > 0 && (
          <div className="swatches">
            {SWATCH_DOTS.map((c) => (
              <span key={c} className="sw" style={{ background: c }} />
            ))}
            <span className="mut3" style={{ fontSize: 11, alignSelf: "center", marginLeft: 2 }}>
              +{product.sw}
            </span>
          </div>
        )}
      </div>
    </>
  );

  if (product.id) {
    return (
      <Link
        to={`/app/catalog/${product.id}`}
        className="pcard"
        aria-label={`View ${product.nm}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        {content}
      </Link>
    );
  }

  return <div className="pcard">{content}</div>;
}
