import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { UiCollection, UiProduct } from "@/services/mappers";
import { ShopBanner } from "@/features/shops/banner";
import { useAddProductToShop } from "./hooks";

export type AddToShopTarget = { collection: UiCollection; product?: UiProduct };

/** Pick a shop, then add a single design (or the whole collection) to it. */
export function AddToShopDialog({
  target,
  onOpenChange,
}: {
  target: AddToShopTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: workspace } = useWorkspace();
  const addToShop = useAddProductToShop();
  const [busy, setBusy] = useState(false);
  const shops = workspace?.shops ?? [];
  const catalog = workspace?.catalogProducts ?? [];

  async function add(shopId: string) {
    if (!target) return;
    const products = target.product ? [target.product] : target.collection.products;
    setBusy(true);
    try {
      for (const product of products) {
        await addToShop.mutateAsync({ shopId, collection: target.collection, product, catalog });
      }
      toast.success(target.product ? "Added to shop" : `Added ${products.length} designs to shop`);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add to shop");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm-modal">
        <div className="modal-pad">
          <DialogHeader>
            <DialogTitle>Add to shop</DialogTitle>
            <DialogDescription className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              {target?.product
                ? `Choose a shop to add “${target.product.nm}” to.`
                : "Choose a shop to add this collection's designs to."}
            </DialogDescription>
          </DialogHeader>

          {shops.length === 0 ? (
            <div className="empty" style={{ padding: "30px 0", textAlign: "center" }}>
              <h3>No shops yet</h3>
              <p className="muted">Create a shop first, then add designs to it.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              {shops.map((shop) => (
                <button
                  key={shop.id}
                  type="button"
                  className="card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: 12,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  disabled={busy}
                  onClick={() => add(shop.id)}
                >
                  <div style={{ width: 96, flex: "none" }}>
                    <ShopBanner
                      source={shop}
                      height={48}
                      layout="center"
                      logoSize={28}
                      radius={8}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{shop.name}</div>
                    <div className="mut3" style={{ fontSize: 12 }}>
                      {shop.currency}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
