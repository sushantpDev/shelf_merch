import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { UiCollection, UiProduct } from "@/services/mappers";
import { collectionProductColorNames, productColorHex, productDescription } from "./colors";

export type DesignTarget = { collection: UiCollection; product: UiProduct; pIdx: number };

/** Read-only design detail with colour variants and an Add-to-shop action. */
export function ProductDetailDialog({
  target,
  onOpenChange,
  onAddToShop,
}: {
  target: DesignTarget | null;
  onOpenChange: (open: boolean) => void;
  onAddToShop: (target: DesignTarget) => void;
}) {
  const [sel, setSel] = useState(0);
  useEffect(() => {
    if (target) setSel(0);
  }, [target]);

  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm-modal" style={{ maxWidth: "min(820px,96vw)", width: "100%" }}>
        {target && <Body target={target} sel={sel} setSel={setSel} onAddToShop={onAddToShop} />}
      </DialogContent>
    </Dialog>
  );
}

function Body({
  target,
  sel,
  setSel,
  onAddToShop,
}: {
  target: DesignTarget;
  sel: number;
  setSel: (i: number) => void;
  onAddToShop: (target: DesignTarget) => void;
}) {
  const { collection, product } = target;
  const title = product.brand ? `${product.brand} ${product.nm}` : product.nm;
  const src = resolveMediaUrl(product.mockupUrl) || resolveMediaUrl(product.imgUrl);
  const names = collectionProductColorNames(collection, product);

  return (
    <div className="modal-pad">
      <DialogHeader>
        <div className="eyebrow">{collection.name}</div>
        <DialogTitle style={{ fontSize: 20 }}>{title}</DialogTitle>
        <DialogDescription className="sr-only">Design detail for {title}</DialogDescription>
      </DialogHeader>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 14 }}>
        <div
          className="img img-mockup"
          style={{
            background: "#f4f6f4",
            borderRadius: "var(--r-sm)",
            aspectRatio: "1 / 1",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
          }}
        >
          {src ? (
            <img
              src={src}
              alt={product.nm}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <span className="mut3">No preview</span>
          )}
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

          <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 18 }}>
            {productDescription(product)}
          </p>

          <button
            type="button"
            className="btn btn-dark btn-block"
            onClick={() => onAddToShop(target)}
          >
            <Store size={16} /> Add to shop
          </button>
        </div>
      </div>
    </div>
  );
}
