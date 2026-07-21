import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DesignedProductThumb } from "@/features/swag/DesignedProductThumb";
import type { UiCollection } from "@/services/mappers";
import { catalogCategoryLabel } from "./types";

export function CollectionViewDialog({
  collection,
  open,
  onOpenChange,
}: {
  collection: UiCollection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!collection) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm-modal sm-catalog-modal">
        <div className="sm-catalog-modal-inner">
          <div className="sm-catalog-modal-head">
            <DialogTitle>{collection.name}</DialogTitle>
            <p className="muted sm-catalog-modal-sub">
              {collection.products.length}{" "}
              {collection.products.length === 1 ? "product" : "products"} in this collection
            </p>
          </div>
          <div className="sm-catalog-modal-main" style={{ padding: "12px 16px" }}>
            <div className="sm-catalog-modal-grid">
              {collection.products.map((p, i) => (
                <div key={`${p.id ?? p.nm}-${i}`} className="pcard sm-catalog-product">
                  <DesignedProductThumb product={p} artworkUrl={collection.artworkUrl} />
                  <div className="meta">
                    {p.brand ? <div className="brand">{p.brand}</div> : null}
                    <div className="nm">{p.nm}</div>
                    <div className="pr">{catalogCategoryLabel(p)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
