import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { UiCollection, UiShop } from "@/services/mappers";
import { ShopPickerList } from "./wizard/ShopPickerList";
import { useSyncCollectionPublish } from "./model";

export function PublishCollectionDialog({
  collection,
  shops,
  open,
  onOpenChange,
}: {
  collection: UiCollection | null;
  shops: UiShop[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const syncPublish = useSyncCollectionPublish();
  const [picked, setPicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && collection) {
      setPicked(new Set(collection.shopIds.length ? collection.shopIds : collection.shopId ? [collection.shopId] : []));
    }
  }, [open, collection]);

  function toggle(shopId: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(shopId)) next.delete(shopId);
      else next.add(shopId);
      return next;
    });
  }

  async function save() {
    if (!collection) return;
    try {
      await syncPublish.mutateAsync({
        collectionId: collection.id,
        shopIds: [...picked],
      });
      toast.success(
        picked.size
          ? `Published to ${picked.size} ${picked.size === 1 ? "shop" : "shops"}`
          : "Collection unpublished from all shops",
      );
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish collection");
    }
  }

  if (!collection) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm-modal">
        <DialogTitle>Publish collection</DialogTitle>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 4, marginBottom: 16 }}>
          Choose one or more shops where <b>{collection.name}</b> should be available.
        </p>

        {shops.length === 0 ? (
          <p className="muted">Create a shop first, then publish this collection.</p>
        ) : (
          <ShopPickerList shops={shops} picked={picked} onToggle={toggle} />
        )}

        <div className="row" style={{ justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button type="button" className="btn btn-ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-brand"
            disabled={syncPublish.isPending || shops.length === 0}
            onClick={save}
          >
            {syncPublish.isPending ? "Publishing…" : "Publish"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
