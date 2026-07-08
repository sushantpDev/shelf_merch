import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductInfoTabs } from "@/features/catalog/views/ProductInfoTabs";
import type { UiCollection, UiProduct } from "@/services/mappers";
import { collectionProductColorNames, productColorHex } from "./colors";
import { DesignedProductThumb } from "./DesignedProductThumb";

export type DesignTarget = { collection: UiCollection; product: UiProduct; pIdx: number };

/** Read-only design detail with colour variants and an Add-to-shop action. */
export function ProductDetailDialog({
  target,
  onOpenChange,
  onAddToShop,
  canAddToShop = true,
}: {
  target: DesignTarget | null;
  onOpenChange: (open: boolean) => void;
  onAddToShop: (target: DesignTarget) => void;
  canAddToShop?: boolean;
}) {
  const [sel, setSel] = useState(0);
  useEffect(() => {
    if (target) setSel(0);
  }, [target]);

  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm-modal" style={{ maxWidth: "min(820px,96vw)", width: "100%" }}>
        {target && (
          <Body
            target={target}
            sel={sel}
            setSel={setSel}
            onAddToShop={onAddToShop}
            canAddToShop={canAddToShop}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Body({
  target,
  sel,
  setSel,
  onAddToShop,
  canAddToShop,
}: {
  target: DesignTarget;
  sel: number;
  setSel: (i: number) => void;
  onAddToShop: (target: DesignTarget) => void;
  canAddToShop: boolean;
}) {
  const { collection, product } = target;
  const title = product.brand ? `${product.brand} ${product.nm}` : product.nm;
  const names = collectionProductColorNames(collection, product);
  const tintHex = names[sel] ? productColorHex(product, names[sel]) : undefined;

  return (
    <div className="modal-pad">
      <DialogHeader>
        <div className="eyebrow">{collection.name}</div>
        <DialogTitle style={{ fontSize: 20 }}>{title}</DialogTitle>
        <DialogDescription className="sr-only">Design detail for {title}</DialogDescription>
      </DialogHeader>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 14 }}>
        <div
          style={{
            background: "#f4f6f4",
            borderRadius: "var(--r-sm)",
            aspectRatio: "1 / 1",
            overflow: "hidden",
          }}
        >
          <DesignedProductThumb
            product={product}
            artworkUrl={collection.artworkUrl}
            tintHex={tintHex}
          />
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

          <div style={{ marginBottom: 18 }}>
            <ProductInfoTabs product={product} />
          </div>

          {canAddToShop ? (
            <button
              type="button"
              className="btn btn-dark btn-block"
              onClick={() => onAddToShop(target)}
            >
              <Store size={16} /> Add to shop
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
