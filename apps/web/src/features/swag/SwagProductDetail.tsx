import { useState } from "react";
import { Store } from "lucide-react";
import { ProductInfoTabs } from "@/features/catalog/views/ProductInfoTabs";
import type { UiCollection, UiProduct } from "@/services/mappers";
import { collectionProductColorNames, productColorHex } from "./colors";
import { DesignedProductThumb } from "./DesignedProductThumb";

export type SwagDesignTarget = { collection: UiCollection; product: UiProduct; pIdx: number };

/** Full-page swag product detail (designed mockup + catalog info + add to shop). */
export function SwagProductDetail({
  target,
  onAddToShop,
}: {
  target: SwagDesignTarget;
  onAddToShop: () => void;
}) {
  const [sel, setSel] = useState(0);
  const { collection, product } = target;
  const title = product.brand ? `${product.brand} ${product.nm}` : product.nm;
  const names = collectionProductColorNames(collection, product);

  return (
    <div>
      <div className="eyebrow">{collection.name}</div>
      <h1 style={{ fontSize: 22, margin: "4px 0 6px" }}>{title}</h1>
      {product.price ? (
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          {product.price}
        </p>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.1fr)",
          gap: 24,
          marginTop: 20,
        }}
      >
        <div
          style={{
            background: "var(--gray-100)",
            borderRadius: "var(--r-sm)",
            aspectRatio: "1 / 1",
            overflow: "hidden",
          }}
        >
          <DesignedProductThumb product={product} artworkUrl={collection.artworkUrl} />
        </div>

        <div>
          {names.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="lbl" style={{ marginBottom: 6 }}>
                Colour variants
              </div>
              <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                {names.map((c, i) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    aria-label={c}
                    aria-pressed={sel === i}
                    onClick={() => setSel(i)}
                    className="sw"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: productColorHex(product, c),
                      outline: sel === i ? "2px solid var(--brand)" : "1px solid var(--line)",
                      outlineOffset: 1,
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <ProductInfoTabs product={product} />
          </div>

          <button
            type="button"
            className="btn btn-dark"
            style={{ minWidth: 200 }}
            onClick={onAddToShop}
          >
            <Store size={16} /> Add to shop
          </button>
        </div>
      </div>
    </div>
  );
}
