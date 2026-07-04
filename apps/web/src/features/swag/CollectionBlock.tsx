import { useState } from "react";
import { Lightbulb, MoreHorizontal, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { UiCollection, UiProduct } from "@/services/mappers";
import { DesignCard } from "./DesignCard";
import { useArchiveCollection, useDeleteCollection, useRestoreCollection } from "./model";

export function CollectionBlock({
  collection,
  onOpenDesign,
  onAddToShop,
  onEditDesign,
  onViewProduct,
}: {
  collection: UiCollection;
  onOpenDesign: (product: UiProduct, pIdx: number) => void;
  onAddToShop: (collection: UiCollection) => void;
  onEditDesign: () => void;
  onViewProduct: (product: UiProduct, pIdx: number) => void;
}) {
  const archive = useArchiveCollection();
  const restore = useRestoreCollection();
  const del = useDeleteCollection();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const archived = collection.status === "archived";
  const productCount = collection.products.length;

  async function run(action: ReturnType<typeof useArchiveCollection>, msg: string, fail: string) {
    try {
      await action.mutateAsync(collection.id);
      toast.success(msg);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : fail);
    }
  }

  return (
    <article className="swag-collection-block">
      <header className="swag-collection-head">
        <div className="swag-collection-head-main">
          <h2 className="swag-collection-title">{collection.name}</h2>
          <div className="swag-collection-meta">
            {collection.code && (
              <span className="swag-collection-code">
                #{collection.code}
                <Lightbulb
                  size={14}
                  className="swag-collection-tip swag-collection-tip--on"
                  aria-hidden
                  fill="currentColor"
                  strokeWidth={1.25}
                />
              </span>
            )}
            <span className="swag-collection-detail">
              Created on {collection.created}
              {collection.by ? ` by ${collection.by}` : ""}
            </span>
            <span className="swag-collection-count">
              {productCount} {productCount === 1 ? "Product" : "Products"}
            </span>
          </div>
        </div>
        <div className="swag-collection-head-actions">
          {archived ? (
            <span className="tag tag-draft">Archived</span>
          ) : (
            <span className="tag tag-ready swag-tag-ready">
              <span className="dot" />
              Design ready
            </span>
          )}
          <button
            type="button"
            className="iconbtn"
            style={{ width: 34, height: 34 }}
            aria-label="Share collection"
            onClick={() => toast.success("Share link copied")}
          >
            <Share2 size={16} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="iconbtn"
                style={{ width: 34, height: 34 }}
                aria-label="Collection actions"
              >
                <MoreHorizontal size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="shop-card-menu">
              {archived ? (
                <>
                  <DropdownMenuItem
                    onSelect={() =>
                      run(restore, "Collection restored", "Failed to restore collection")
                    }
                  >
                    Restore to saved designs
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="shop-card-menu-item--danger"
                    onSelect={() => setConfirmDelete(true)}
                  >
                    Delete permanently
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onSelect={() => onAddToShop(collection)}>
                    Add collection to shop
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() =>
                      run(archive, "Collection archived", "Failed to archive collection")
                    }
                  >
                    Archive collection
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="shop-card-menu-item--danger"
                    onSelect={() => setConfirmDelete(true)}
                  >
                    Delete collection
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {productCount > 0 && (
        <div className="swag-designs-grid swag-designs-grid--in-collection">
          {collection.products.map((p, i) => (
            <DesignCard
              key={`${p.id ?? p.nm}-${i}`}
              collection={collection}
              product={p}
              showToolbar
              onOpen={() => onOpenDesign(p, i)}
              onEditDesign={onEditDesign}
              onViewProduct={() => onViewProduct(p, i)}
              onAddToShop={() => onAddToShop(collection)}
            />
          ))}
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{collection.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the collection and its designs. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await del.mutateAsync(collection.id);
                  toast.success("Collection deleted");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Failed to delete collection");
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}
