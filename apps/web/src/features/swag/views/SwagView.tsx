import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, Shirt } from "lucide-react";
import { toast } from "sonner";
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
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/tenant/PageHeader";
import type { SwagTab, SwagVm } from "../controllers/useSwagController";
import { swagEditDraftPath } from "../paths";
import { PublishCollectionDialog } from "../PublishCollectionDialog";
import { SwagCollectionCard } from "../SwagCollectionCard";
import { useArchiveCollection, useDeleteCollection, useRestoreCollection } from "../model";
import type { UiCollection } from "@/services/mappers";
import startDesigningImg from "../../../../assets/start_designing.png";

const TABS: SwagTab[] = ["Collections", "Archived"];

export function SwagView(vm: SwagVm) {
  const navigate = useNavigate();
  const archiveCollection = useArchiveCollection();
  const restoreCollection = useRestoreCollection();
  const deleteCollection = useDeleteCollection();
  const [deleteTarget, setDeleteTarget] = useState<UiCollection | null>(null);
  const isArchivedTab = vm.tab === "Archived";

  if (vm.isLoading) {
    return <LoadingState message="Loading swag…" fullScreen={false} />;
  }
  if (vm.errorMessage) {
    return (
      <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
        {vm.errorMessage}
      </div>
    );
  }

  async function handleArchive(collectionId: string, name: string) {
    try {
      await archiveCollection.mutateAsync(collectionId);
      toast.success(`"${name}" archived`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to archive collection");
    }
  }

  async function handlePublish(col: UiCollection) {
    try {
      let target = col;
      if (col.status === "archived") {
        target = await restoreCollection.mutateAsync(col.id);
        vm.onSelectTab("Collections");
        toast.success(`"${col.name}" restored to collections`);
      }
      vm.onPublishCollection(target);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to prepare collection for publishing");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteCollection.mutateAsync(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete collection");
    }
  }

  return (
    <>
      <PageHeader
        title="Swag"
        subtitle="Design and publish branded collections to your shops."
        actions={
          <>
            {vm.canDesignSwag ? (
              <Link to="/app/swag/new" className="btn btn-ghost">
                <Plus size={16} /> Start designing
              </Link>
            ) : null}
            <Link to="/app/catalog" className="btn btn-dark">
              Purchase swag
            </Link>
          </>
        }
      />

      <div className="swag-hero-banner" role="img" aria-label="Build your swag collection" />

      <div className="tabs" style={{ marginBottom: 22 }} role="tablist" aria-label="Swag filter">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={t === vm.tab}
            className={t === vm.tab ? "on" : ""}
            onClick={() => vm.onSelectTab(t)}
          >
            {t === "Collections" && vm.tab === "Collections"
              ? `Collections (${vm.collections.length})`
              : t}
          </button>
        ))}
      </div>

      {vm.empty ? (
        isArchivedTab ? (
          <div className="card empty" style={{ padding: 48 }}>
            <div className="ic" aria-hidden="true">
              <Shirt size={34} color="var(--gray-300)" />
            </div>
            <h3>No archived collections</h3>
            <p>Archived collections will appear here.</p>
          </div>
        ) : (
          <div
            className="card swag-empty-designer"
            style={{ position: "relative", overflow: "hidden", padding: 0 }}
          >
            <img
              src={startDesigningImg}
              alt="Design your swag collection"
              className="start-designing-img"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            {vm.canDesignSwag ? (
              <button
                type="button"
                className="btn btn-dark btn-lg"
                style={{
                  padding: "0 20px",
                  position: "absolute",
                  bottom: 24,
                  left: 80,
                  zIndex: 10,
                }}
                onClick={vm.onStartDesigning}
              >
                <Plus size={16} /> Start designing
              </button>
            ) : null}
          </div>
        )
      ) : (
        <div className="swag-col-list">
          {vm.collections.map((col) => {
            const shopIds = col.shopIds.length ? col.shopIds : col.shopId ? [col.shopId] : [];
            const shopNames = shopIds
              .map((id) => vm.shopNameById.get(id))
              .filter((n): n is string => Boolean(n));
            const isDraft = col.status === "draft";
            return (
              <SwagCollectionCard
                key={col.id}
                collection={col}
                shopNames={shopNames}
                archived={isArchivedTab}
                isDraft={isDraft}
                canManage={vm.canManageSwag}
                canPublish={vm.canPublish}
                canDesign={vm.canDesignSwag}
                busy={
                  archiveCollection.isPending ||
                  deleteCollection.isPending ||
                  restoreCollection.isPending
                }
                onPublish={() => handlePublish(col)}
                onArchive={() => handleArchive(col.id, col.name)}
                onDelete={() => setDeleteTarget(col)}
                onEditDraft={() => navigate(swagEditDraftPath(col.id))}
              />
            );
          })}
        </div>
      )}

      <PublishCollectionDialog
        collection={vm.publishCollection}
        shops={vm.shops}
        open={vm.publishCollection !== null}
        onOpenChange={(open) => !open && vm.onPublishCollection(null)}
      />

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the collection from your Swag library and unpublish it from
              all shops. Product designs and order history are kept in the system.
              {" "}
              If any products from this collection have been ordered, deletion will be blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteCollection.isPending}
              style={{ background: "var(--danger)" }}
            >
              {deleteCollection.isPending ? "Deleting…" : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
