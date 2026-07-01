import { type KeyboardEvent, type MouseEvent } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UiCollection, UiProduct } from "@/services/mappers";
import { collectionProductColorNames, productColorHex } from "./colors";
import { DesignedProductThumb } from "./DesignedProductThumb";

function PriceLine({ price }: { price: string }) {
  const match = price.match(/^as low as\s+(.+)$/i);
  if (match) {
    return (
      <div className="swag-design-card-price">
        <span className="mut3">As low as </span>
        <strong>{match[1]}</strong>
      </div>
    );
  }
  return (
    <div className="swag-design-card-price">
      <strong>{price}</strong>
    </div>
  );
}

/** A single branded design within a collection. */
export function DesignCard({
  collection,
  product,
  onOpen,
  productView = false,
  onEditDesign,
  onViewProduct,
  onAddToShop,
}: {
  collection: UiCollection;
  product: UiProduct;
  onOpen: () => void;
  productView?: boolean;
  onEditDesign?: () => void;
  onViewProduct?: () => void;
  onAddToShop?: () => void;
}) {
  const names = collectionProductColorNames(collection, product);
  const swatches = names.slice(0, 4);
  const more = names.length - swatches.length;

  const meta = (
    <>
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
      {productView && product.price ? <PriceLine price={product.price} /> : null}
    </>
  );

  if (!productView) {
    return (
      <button
        type="button"
        className="pcard swag-design-card"
        style={{ textAlign: "left" }}
        onClick={onOpen}
        aria-label={`View ${product.nm} design`}
      >
        <DesignedProductThumb product={product} artworkUrl={collection.artworkUrl} />
        <div className="meta">{meta}</div>
      </button>
    );
  }

  function stop(e: MouseEvent | KeyboardEvent) {
    e.stopPropagation();
  }

  return (
    <article className="pcard swag-design-card swag-design-card--product-view">
      <div
        className="swag-design-card-hit"
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        aria-label={`View ${product.nm} design`}
      >
        <DesignedProductThumb product={product} artworkUrl={collection.artworkUrl} />
        <div className="swag-card-actions" onClick={stop} onKeyDown={stop}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="swag-card-menu"
                aria-label="Product actions"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="shop-card-menu">
              <DropdownMenuItem onSelect={() => onEditDesign?.()}>
                <span>Edit Design</span>
                <span className="tag tag-beta">Beta</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onViewProduct?.()}>View Product</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onAddToShop?.()}>Add to Shop</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div
        className="meta swag-design-card-meta-hit"
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        {meta}
      </div>
    </article>
  );
}
