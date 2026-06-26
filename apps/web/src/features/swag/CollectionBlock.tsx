import { useState } from "react";
import { MoreHorizontal, Share2 } from "lucide-react";
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
import { useArchiveCollection, useDeleteCollection, useRestoreCollection } from "./hooks";

export function CollectionBlock({
  collection,
  onOpenDesign,
  onAddToShop,
}: {
  collection: UiCollection;
  onOpenDesign: (product: UiProduct, pIdx: number) => void;
  onAddToShop: (collection: UiCollection) => void;
}) {
  const archive = useArchiveCollection();
  const restore = useRestoreCollection();
  const del = useDeleteCollection();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const archived = collection.status === "archived";

  async function run(action: ReturnType<typeof useArchiveCollection>, msg: string, fail: string) {
    try {
      await action.mutateAsync(collection.id);
      toast.success(msg);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : fail);
    }
  }

  return (
    <div className="swag-collection-block">
      <div
        className="row"
        style={{
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
          gap: 12,
        }}
      >
        <div>
          <div
            className="row"
            style={{ gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}
          >
            <h3 style={{ fontSize: 17 }}>{collection.name}</h3>
            <span className="mut3" style={{ fontSize: 12 }}>
              #{collection.code}
            </span>
          </div>
          <div className="mut3" style={{ fontSize: 12 }}>
            Created on {collection.created} by {collection.by} · {collection.products.length}{" "}
            {collection.products.length === 1 ? "Product" : "Products"}
          </div>
        </div>
        <div className="row" style={{ gap: 8, alignItems: "center", flex: "none" }}>
          {archived ? (
            <span className="tag tag-draft">Archived</span>
          ) : (
            <span className="tag tag-ready">Design ready</span>
          )}
          <button
            type="button"
            className="iconbtn"
            style={{ width: 30, height: 30 }}
            aria-label="Share collection"
            onClick={() => toast.success("Share link copied")}
          >
            <Share2 size={15} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="iconbtn"
                style={{ width: 30, height: 30 }}
                aria-label="Collection actions"
              >
                <MoreHorizontal size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
                    onSelect={() => setConfirmDelete(true)}
                    style={{ color: "var(--danger)" }}
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
                    onSelect={() => setConfirmDelete(true)}
                    style={{ color: "var(--danger)" }}
                  >
                    Delete collection
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid swag-designs-grid">
        {collection.products.map((p, i) => (
          <DesignCard
            key={`${p.id ?? p.nm}-${i}`}
            collection={collection}
            product={p}
            onOpen={() => onOpenDesign(p, i)}
          />
        ))}
      </div>

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
    </div>
  );
}
