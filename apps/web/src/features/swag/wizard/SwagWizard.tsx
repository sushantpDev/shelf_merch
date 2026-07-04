import { useReducer, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { LoadingState } from "@/components/LoadingState";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { UiProduct } from "@/services/mappers";
import { bakeMockup, placementKey, type Placement } from "../mockup-bake";
import { useCreateCollection } from "../hooks";
import { WizardChrome } from "./WizardChrome";
import { NameStep } from "./NameStep";
import { CatalogStep } from "./CatalogStep";
import { ArtworkStep } from "./ArtworkStep";

export type ArtFile = { preview: string; name: string; file?: File };

export type SwagDraft = {
  step: 0 | 1 | 2;
  name: string;
  picked: number[];
  art: ArtFile | null;
  placements: Record<string, Placement>;
};

const STEPS = ["Collection", "Products", "Artwork"];

type Action =
  | { type: "setStep"; step: 0 | 1 | 2 }
  | { type: "setName"; name: string }
  | { type: "togglePick"; index: number }
  | { type: "setArt"; art: ArtFile }
  | { type: "clearArt" }
  | { type: "setPlacement"; key: string; placement: Placement }
  | { type: "resetPlacements" };

function reducer(state: SwagDraft, action: Action): SwagDraft {
  switch (action.type) {
    case "setStep":
      return { ...state, step: action.step };
    case "setName":
      return { ...state, name: action.name };
    case "togglePick": {
      const has = state.picked.includes(action.index);
      return {
        ...state,
        picked: has
          ? state.picked.filter((i) => i !== action.index)
          : [...state.picked, action.index],
      };
    }
    case "setArt":
      return { ...state, art: action.art };
    case "clearArt":
      return { ...state, art: null, placements: {} };
    case "setPlacement":
      return { ...state, placements: { ...state.placements, [action.key]: action.placement } };
    case "resetPlacements":
      return { ...state, placements: {} };
    default:
      return state;
  }
}

export function SwagWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const search = { shop: searchParams.get("shop") ?? undefined };
  const shopId = search.shop;
  const { data: workspace, isLoading } = useWorkspace();
  const createCollection = useCreateCollection();
  const [generating, setGenerating] = useState(false);

  const [draft, dispatch] = useReducer(reducer, {
    step: 0,
    name: "New Employee Swag",
    picked: [],
    art: null,
    placements: {},
  });

  if (isLoading && !workspace) {
    return <LoadingState message="Loading catalog…" fullScreen={false} />;
  }
  const catalog: UiProduct[] = workspace?.catalogProducts ?? [];

  function exit() {
    if (shopId) navigate(`/app/shops/${shopId}`);
    else navigate("/app/swag");
  }

  const pickedProducts = draft.picked.map((i) => catalog[i]).filter(Boolean) as UiProduct[];

  async function generate() {
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
      exit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate designs");
    } finally {
      setGenerating(false);
    }
  }

  if (generating) {
    return <LoadingState message="Generating designs…" fullScreen={false} />;
  }

  const backLink = (label: string, step: 0 | 1) => (
    <button
      type="button"
      className="lnk"
      style={{ background: "none", border: "none", cursor: "pointer" }}
      onClick={() => dispatch({ type: "setStep", step })}
    >
      {label}
    </button>
  );

  if (draft.step === 0) {
    return (
      <WizardChrome
        title="Design swag"
        steps={STEPS}
        activeIndex={0}
        onExit={exit}
        exitLabel="Back to my swag"
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <button
              type="button"
              className="lnk"
              style={{ background: "none", border: "none", cursor: "pointer" }}
              onClick={exit}
            >
              Back to my swag
            </button>
            <button
              type="button"
              className="btn btn-dark"
              onClick={() => {
                if (!draft.name.trim()) {
                  toast.error("Enter a collection name");
                  return;
                }
                dispatch({ type: "setStep", step: 1 });
              }}
            >
              Next
            </button>
          </div>
        }
      >
        <NameStep name={draft.name} onChange={(name) => dispatch({ type: "setName", name })} />
      </WizardChrome>
    );
  }

  if (draft.step === 1) {
    return (
      <WizardChrome
        title="Design swag"
        steps={STEPS}
        activeIndex={1}
        onExit={exit}
        footer={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div className="row" style={{ gap: 12, alignItems: "center" }}>
              <b style={{ fontSize: 15 }}>{draft.name}</b>
              <span className="tag tag-soft" style={{ fontWeight: 700 }}>
                {draft.picked.length} item{draft.picked.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="row" style={{ gap: 12, alignItems: "center" }}>
              {backLink("Back", 0)}
              <button
                type="button"
                className="btn btn-dark"
                disabled={!draft.picked.length}
                onClick={() => dispatch({ type: "setStep", step: 2 })}
              >
                Add artwork
              </button>
            </div>
          </div>
        }
      >
        <CatalogStep
          catalog={catalog}
          picked={draft.picked}
          onToggle={(index) => dispatch({ type: "togglePick", index })}
        />
      </WizardChrome>
    );
  }

  return (
    <WizardChrome
      title="Design swag"
      steps={STEPS}
      activeIndex={2}
      onExit={exit}
      footer={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div className="row" style={{ gap: 12, alignItems: "center" }}>
            <b style={{ fontSize: 15 }}>{draft.name}</b>
            <span className="tag tag-soft" style={{ fontWeight: 700 }}>
              {pickedProducts.length} item{pickedProducts.length === 1 ? "" : "s"} selected
            </span>
          </div>
          <div className="row" style={{ gap: 12, alignItems: "center" }}>
            {backLink("Back to products", 1)}
            <button
              type="button"
              className="btn btn-brand"
              disabled={!draft.art}
              onClick={generate}
            >
              Generate designs
            </button>
          </div>
        </div>
      }
    >
      <ArtworkStep
        products={pickedProducts}
        art={draft.art}
        placements={draft.placements}
        onSetArt={(art) => dispatch({ type: "setArt", art })}
        onClearArt={() => dispatch({ type: "clearArt" })}
        onResetPlacements={() => dispatch({ type: "resetPlacements" })}
        onPlacementChange={(key, placement) => dispatch({ type: "setPlacement", key, placement })}
      />
    </WizardChrome>
  );
}
