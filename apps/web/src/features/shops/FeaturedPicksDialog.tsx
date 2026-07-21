import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { UiShop } from "@/services/mappers";
import { ProductThumb } from "./ProductThumb";
import { useUpdateShop } from "./model";
import { activeListingKeysForShop, type ShopListing } from "./shopListings";

/** Pick products for the shop landing “Featured Products” row. */
export function FeaturedPicksDialog({
  shop,
  listings,
  open,
  onOpenChange,
}: {
  shop: UiShop;
  listings: ShopListing[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateShop = useUpdateShop();
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const listingKeys = useMemo(() => new Set(listings.map((l) => l.key)), [listings]);

  const enabledKeys = useMemo(
    () => new Set(activeListingKeysForShop(shop, listingKeys)),
    [shop.activeListingKeys, shop.selectedCatalogProductIds, listingKeys],
  );

  const eligible = useMemo(
    () => listings.filter((l) => enabledKeys.has(l.key)),
    [listings, enabledKeys],
  );

  useEffect(() => {
    if (open) {
      const saved = (shop.featuredListingKeys || []).filter((k) => enabledKeys.has(k));
      setPicked(new Set(saved.length ? saved : []));
    }
  }, [open, shop.featuredListingKeys, enabledKeys]);

  function toggle(key: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function save() {
    const featuredListingKeys = [...picked].filter((k) => enabledKeys.has(k));
    try {
      await updateShop.mutateAsync({
        shopId: shop.id,
        input: { featuredListingKeys },
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
            {enabledKeys.size === 0 ? (
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
                eligible.map((l) => {
                  const on = picked.has(l.key);
                  return (
                    <button
                      key={l.key}
                      type="button"
                      className={`pcard sm-catalog-product${on ? " on" : ""}`}
                      aria-pressed={on}
                      onClick={() => toggle(l.key)}
                    >
                      <div className={`sm-catalog-check${on ? " on" : ""}`}>{on ? "✓" : ""}</div>
                      <ProductThumb product={l.product} branded />
                      <div className="meta">
                        {l.product.brand ? <div className="brand">{l.product.brand}</div> : null}
                        <div className="nm">{l.product.nm}</div>
                        <div className="sm-catalog-collection-label">Collection</div>
                        <div className="sm-catalog-collection-name">{l.collectionName}</div>
                        <div className="pr">{l.product.price || ""}</div>
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
                disabled={updateShop.isPending || enabledKeys.size === 0}
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
