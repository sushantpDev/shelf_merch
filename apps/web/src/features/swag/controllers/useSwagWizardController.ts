import { useReducer, useState, type Dispatch } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useWorkspace } from "@/hooks/useWorkspace";
import { bakeMockup } from "../mockup-bake";
import { useCreateCollection } from "../model";
import type { UiProduct } from "../model";
import {
  INITIAL_SWAG_DRAFT,
  swagDraftReducer,
  type SwagAction,
  type SwagDraft,
} from "../swagDraft";

export type SwagWizardVm = {
  isLoading: boolean;
  isGenerating: boolean;
  draft: SwagDraft;
  dispatch: Dispatch<SwagAction>;
  catalog: UiProduct[];
  pickedProducts: UiProduct[];
  onExit: () => void;
  onStep: (step: 0 | 1 | 2) => void;
  onSubmitName: () => void;
  onGenerate: () => void;
};

/** Controller for the design-swag wizard: draft reducer, mockup baking, save flow. */
export function useSwagWizardController(): SwagWizardVm {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shop") ?? undefined;
  const { data: workspace, isLoading } = useWorkspace();
  const createCollection = useCreateCollection();
  const [generating, setGenerating] = useState(false);
  const [draft, dispatch] = useReducer(swagDraftReducer, INITIAL_SWAG_DRAFT);

  const catalog: UiProduct[] = workspace?.catalogProducts ?? [];
  const pickedProducts = draft.picked.map((i) => catalog[i]).filter(Boolean) as UiProduct[];

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

  async function onGenerate() {
    if (!draft.art) return;
    setGenerating(true);
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

      const col = await createCollection.mutateAsync({
        shopId,
        name: draft.name || "New collection",
        pickedIndices: draft.picked,
        catalog,
        artwork: draft.art
          ? { file: draft.art.file, preview: draft.art.preview, name: draft.art.name }
          : undefined,
        mockups,
      });
      toast.success(`Collection "${col.name}" saved — use Add to shop when you're ready`);
      onExit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate designs");
    } finally {
      setGenerating(false);
    }
  }

  return {
    isLoading: isLoading && !workspace,
    isGenerating: generating,
    draft,
    dispatch,
    catalog,
    pickedProducts,
    onExit,
    onStep: (step) => dispatch({ type: "setStep", step }),
    onSubmitName,
    onGenerate,
  };
}
