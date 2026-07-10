import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { UiProduct, UiShop } from "@/services/mappers";
import { ProductThumb } from "./ProductThumb";
import { useUpdateShop } from "./model";
import { catalogProductKey } from "./types";

/** Pick products for the shop landing “Featured Products” row. */
export function FeaturedPicksDialog({
  shop,
  products,
  open,
  onOpenChange,
}: {
  shop: UiShop;
  products: UiProduct[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateShop = useUpdateShop();
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const enabledIds = useMemo(
    () => new Set((shop.selectedCatalogProductIds || []).map(String)),
    [shop.selectedCatalogProductIds],
  );

  const eligible = useMemo(
    () =>
      products
        .map((p, i) => ({ p, key: catalogProductKey(p, i) }))
        .filter(({ key }) => enabledIds.has(key)),
    [products, enabledIds],
  );

  useEffect(() => {
    if (open) {
      const saved = (shop.featuredCatalogProductIds || []).filter((id) => enabledIds.has(id));
      setPicked(new Set(saved));
    }
  }, [open, shop.featuredCatalogProductIds, enabledIds]);

  function toggle(key: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function save() {
    const ids = [...picked].filter((id) => !id.startsWith("demo:"));
    try {
      await updateShop.mutateAsync({
        shopId: shop.id,
        input: { featuredCatalogProductIds: ids },
      });
      toast.success("Featured picks updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save featured picks");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm-modal sm-catalog-modal">
        <div className="sm-catalog-modal-inner">
          <div className="sm-catalog-modal-head">
            <DialogTitle>Edit featured picks</DialogTitle>
            <p className="muted sm-catalog-modal-sub">
              Choose products to highlight in the Featured Products section of{" "}
              <b>{shop.name}</b>.
            </p>
            {enabledIds.size === 0 ? (
              <div className="sm-catalog-modal-warn">
                Enable products in Edit Catalog first, then pick featured items here.
              </div>
            ) : null}
          </div>

          <div className="sm-catalog-modal-main" style={{ padding: "12px 16px" }}>
            <div className="sm-catalog-modal-grid">
              {eligible.length === 0 ? (
                <p className="muted" style={{ padding: "16px 0" }}>
                  No eligible products yet.
                </p>
              ) : (
                eligible.map(({ p, key }) => {
                  const on = picked.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`pcard sm-catalog-product${on ? " on" : ""}`}
                      aria-pressed={on}
                      onClick={() => toggle(key)}
                    >
                      <div className={`sm-catalog-check${on ? " on" : ""}`}>{on ? "✓" : ""}</div>
                      <ProductThumb product={p} />
                      <div className="meta">
                        {p.brand ? <div className="brand">{p.brand}</div> : null}
                        <div className="nm">{p.nm}</div>
                        <div className="pr">{p.price || ""}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="sm-catalog-modal-footer">
            <span className="mut3">
              {picked.size} featured
              {eligible.length ? ` · ${eligible.length} available` : ""}
            </span>
            <div className="row" style={{ gap: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-brand"
                disabled={updateShop.isPending || enabledIds.size === 0}
                onClick={save}
              >
                {updateShop.isPending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
