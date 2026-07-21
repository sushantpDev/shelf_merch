import { Archive, Pencil, Store, Trash2 } from "lucide-react";
import type { UiCollection } from "@/services/mappers";
import { CollectionInlineCard } from "./CollectionInlineCard";

export function SwagCollectionCard({
  collection,
  shopNames,
  archived,
  isDraft,
  canManage,
  canPublish,
  canDesign,
  onPublish,
  onArchive,
  onDelete,
  onEditDraft,
  busy,
}: {
  collection: UiCollection;
  shopNames: string[];
  archived: boolean;
  isDraft: boolean;
  canManage: boolean;
  canPublish: boolean;
  canDesign: boolean;
  onPublish: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onEditDraft: () => void;
  busy?: boolean;
}) {
  const isPublished = !archived && shopNames.length > 0;
  const statusLabel = archived ? "Archived" : isDraft ? "Draft" : isPublished ? "Published" : "Ready";

  return (
    <CollectionInlineCard
      collection={collection}
      actions={
        <>
          <span className={`tag ${archived || isDraft ? "tag-warn" : isPublished ? "tag-live" : "tag-warn"}`}>
            {!archived && isPublished ? <span className="dot" /> : null}
            {statusLabel}
          </span>
          {!archived && isPublished && shopNames.length > 0 ? (
            <div className="swag-col-card-chips">
              {shopNames.map((name) => (
                <span key={name} className="swag-shop-chip">
                  {name}
                </span>
              ))}
            </div>
          ) : null}
          {!archived && isDraft && canDesign ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onEditDraft}>
              <Pencil size={14} /> Edit &amp; publish
            </button>
          ) : null}
          {canPublish && (!isDraft || archived) ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onPublish}>
              <Store size={14} /> {archived ? "Publish to shop" : "Publish to shop"}
            </button>
          ) : null}
          {canManage && !archived ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={busy}
              onClick={onArchive}
            >
              <Archive size={14} /> Archive
            </button>
          ) : null}
          {canManage && archived ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-danger-ghost"
              disabled={busy}
              onClick={onDelete}
            >
              <Trash2 size={14} /> Delete
            </button>
          ) : null}
        </>
      }
    />
  );
}
