import { useEffect, useReducer, useRef, useState, type Dispatch } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { refreshCatalogProducts } from "@/services/api-bridge";
import { useWorkspace } from "@/hooks/useWorkspace";
import { draftFromCollection } from "../draftFromCollection";
import { bakeMockup } from "../mockup-bake";
import { buildPreviousUploads, type PreviousArtwork } from "../wizard/artworkHistory";
import { useCreateCollection, useSyncCollectionPublish, useUpdateCollection } from "../model";
import type { UiProduct, UiShop } from "../model";
import {
  INITIAL_SWAG_DRAFT,
  swagDraftReducer,
  type SwagAction,
  type SwagDraft,
} from "../swagDraft";

export type SwagWizardVm = {
  isLoading: boolean;
  isWorking: boolean;
  isEditing: boolean;
  draft: SwagDraft;
  dispatch: Dispatch<SwagAction>;
  catalog: UiProduct[];
  pickedProducts: UiProduct[];
  previousUploads: PreviousArtwork[];
  shops: UiShop[];
  pickedShops: Set<string>;
  shopName?: string;
  onExit: () => void;
  onStep: (step: SwagDraft["step"]) => void;
  onSubmitName: () => void;
  onToggleShop: (shopId: string) => void;
  onPublish: () => void;
};

/** Controller for the design-swag wizard: draft reducer, mockup baking, save + publish flow. */
export function useSwagWizardController(): SwagWizardVm {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shop") ?? undefined;
  const editCollectionId = searchParams.get("edit") ?? undefined;
  const { data: workspace, isLoading } = useWorkspace();
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const syncPublish = useSyncCollectionPublish();
  const [working, setWorking] = useState(false);
  const [pickedShops, setPickedShops] = useState<Set<string>>(() =>
    shopId ? new Set([shopId]) : new Set(),
  );
  const [draft, dispatch] = useReducer(swagDraftReducer, INITIAL_SWAG_DRAFT);
  const hydratedEditId = useRef<string | null>(null);

  const workspaceCatalog: UiProduct[] = workspace?.catalogProducts ?? [];
  const { data: refreshedCatalog, isLoading: isRefreshingCatalog } = useQuery({
    queryKey: ["catalog", "all"],
    queryFn: () => refreshCatalogProducts(),
    staleTime: 30_000,
    placeholderData: workspace
      ? { items: workspaceCatalog, total: workspace.catalogTotal ?? workspaceCatalog.length }
      : undefined,
  });
  const catalog: UiProduct[] = refreshedCatalog?.items ?? workspaceCatalog;
  const shops = workspace?.shops ?? [];
  const editCollection = editCollectionId
    ? workspace?.collections.find((c) => c.id === editCollectionId)
    : undefined;

  useEffect(() => {
    if (!editCollection || !catalog.length || hydratedEditId.current === editCollection.id) return;
    if (editCollection.status !== "draft") {
      toast.error("Only draft collections can be edited");
      navigate("/app/swag");
      return;
    }
    dispatch({ type: "hydrate", draft: draftFromCollection(editCollection, catalog) });
    hydratedEditId.current = editCollection.id;
    const linked = editCollection.shopIds.length
      ? editCollection.shopIds
      : editCollection.shopId
        ? [editCollection.shopId]
        : [];
    if (linked.length) setPickedShops(new Set(linked));
  }, [editCollection, catalog, navigate]);

  const pickedProducts = draft.picked.map((i) => catalog[i]).filter(Boolean) as UiProduct[];
  const shopName = shopId ? workspace?.shops.find((s) => s.id === shopId)?.name : undefined;
  const previousUploads = buildPreviousUploads(
    workspace?.collections ?? [],
    workspace?.kits ?? [],
  );

  function onExit() {
    if (shopId) navigate(`/app/shops/${shopId}`);
    else navigate("/app/swag");
  }

  function onSubmitName() {
    if (!draft.name.trim()) {
      toast.error("Enter a collection name");
      return;
    }
    dispatch({ type: "setStep", step: 1 });
  }

  function onToggleShop(id: string) {
    setPickedShops((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onPublish() {
    if (!draft.art) {
      toast.error("Add artwork before publishing");
      return;
    }
    if (!pickedShops.size) {
      toast.error("Select at least one shop");
      return;
    }

    setWorking(true);
    try {
      const artUrl = draft.art.preview;
      const baked = await Promise.all(
        draft.picked.map((i, idx) => {
          const cp = catalog[i];
          const key = cp?.id || `idx${idx}`;
          return bakeMockup(cp, artUrl, draft.placements[key] ?? null);
        }),
      );
      const mockups = draft.picked
        .map((i, idx) => {
          const cp = catalog[i];
          if (!cp?.id || !baked[idx]) return null;
          return { catalogProductId: cp.id, dataUrl: baked[idx] };
        })
        .filter((m): m is { catalogProductId: string; dataUrl: string } => m !== null);

      if (!mockups.length) {
        throw new Error("Failed to generate designs — try again");
      }
      if (mockups.length < draft.picked.length) {
        throw new Error("Failed to generate designs for all products — try again");
      }

      const payload = {
        name: draft.name || "New collection",
        pickedIndices: draft.picked,
        catalog,
        artwork: draft.art
          ? { file: draft.art.file, preview: draft.art.preview, name: draft.art.name }
          : undefined,
        mockups,
      };

      const col = editCollectionId
        ? await updateCollection.mutateAsync({ collectionId: editCollectionId, ...payload })
        : await createCollection.mutateAsync(payload);

      await syncPublish.mutateAsync({
        collectionId: col.id,
        shopIds: [...pickedShops],
      });

      toast.success(
        `Published "${col.name}" to ${pickedShops.size} ${pickedShops.size === 1 ? "shop" : "shops"}`,
      );
      onExit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate and publish");
    } finally {
      setWorking(false);
    }
  }

  return {
    isLoading:
      (isLoading && !workspace) ||
      (isRefreshingCatalog && catalog.length === 0) ||
      (Boolean(editCollectionId) && !hydratedEditId.current && Boolean(editCollection)),
    isWorking: working,
    isEditing: Boolean(editCollectionId),
    draft,
    dispatch,
    catalog,
    pickedProducts,
    previousUploads,
    shops,
    pickedShops,
    shopName,
    onExit,
    onStep: (step) => dispatch({ type: "setStep", step }),
    onSubmitName,
    onToggleShop,
    onPublish,
  };
}
