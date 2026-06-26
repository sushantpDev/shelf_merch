import type { UiCollection, UiProduct } from "@/services/mappers";
import { ProductThumb } from "@/features/shops/ProductThumb";
import { collectionProductColorNames, productColorHex } from "./colors";

/** A single branded design within a collection. */
export function DesignCard({
  collection,
  product,
  onOpen,
}: {
  collection: UiCollection;
  product: UiProduct;
  onOpen: () => void;
}) {
  const names = collectionProductColorNames(collection, product);
  const swatches = names.slice(0, 4);
  const more = names.length - swatches.length;

  return (
    <button
      type="button"
      className="pcard swag-design-card"
      style={{ textAlign: "left" }}
      onClick={onOpen}
      aria-label={`View ${product.nm} design`}
    >
      <ProductThumb product={product} branded />
      <div className="meta">
        {(swatches.length > 0 || more > 0) && (
          <div className="swatches">
            {swatches.map((c) => (
              <span
                key={c}
                className="sw"
                style={{ background: productColorHex(product, c) }}
                title={c}
              />
            ))}
            {more > 0 && (
              <span className="mut3" style={{ fontSize: 10, alignSelf: "center" }}>
                +{more}
              </span>
            )}
          </div>
        )}
        {product.brand && <div className="brand">{product.brand}</div>}
        <div className="nm">{product.nm}</div>
      </div>
    </button>
  );
}
