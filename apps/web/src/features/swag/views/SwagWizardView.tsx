import { LoadingState } from "@/components/LoadingState";
import { WizardChrome } from "../wizard/WizardChrome";
import { NameStep } from "../wizard/NameStep";
import { CatalogStep } from "../wizard/CatalogStep";
import { ArtworkStep } from "../wizard/ArtworkStep";
import type { SwagWizardVm } from "../controllers/useSwagWizardController";

const STEPS = ["Collection", "Products", "Artwork"];

/** Design-swag wizard shell; all state and actions come from the controller. */
export function SwagWizardView(vm: SwagWizardVm) {
  const { draft, dispatch } = vm;

  if (vm.isLoading) {
    return <LoadingState message="Loading catalog…" fullScreen={false} />;
  }
  if (vm.isGenerating) {
    return <LoadingState message="Generating designs…" fullScreen={false} />;
  }

  const backLink = (label: string, step: 0 | 1) => (
    <button
      type="button"
      className="lnk"
      style={{ background: "none", border: "none", cursor: "pointer" }}
      onClick={() => vm.onStep(step)}
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
        onExit={vm.onExit}
        exitLabel="Back to my swag"
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <button
              type="button"
              className="lnk"
              style={{ background: "none", border: "none", cursor: "pointer" }}
              onClick={vm.onExit}
            >
              Back to my swag
            </button>
            <button type="button" className="btn btn-dark" onClick={vm.onSubmitName}>
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
        onExit={vm.onExit}
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
                onClick={() => vm.onStep(2)}
              >
                Add artwork
              </button>
            </div>
          </div>
        }
      >
        <CatalogStep
          catalog={vm.catalog}
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
      onExit={vm.onExit}
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
              {vm.pickedProducts.length} item{vm.pickedProducts.length === 1 ? "" : "s"} selected
            </span>
          </div>
          <div className="row" style={{ gap: 12, alignItems: "center" }}>
            {backLink("Back to products", 1)}
            <button
              type="button"
              className="btn btn-brand"
              disabled={!draft.art}
              onClick={vm.onGenerate}
            >
              Generate designs
            </button>
          </div>
        </div>
      }
    >
      <ArtworkStep
        products={vm.pickedProducts}
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
