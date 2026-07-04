import { useMemo, useReducer, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { LoadingState } from "@/components/LoadingState";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { UiProduct } from "@/services/mappers";
import { ProductThumb } from "@/features/shops/ProductThumb";
import { WizardChrome } from "@/features/swag/wizard/WizardChrome";
import { CatalogStep } from "@/features/swag/wizard/CatalogStep";
import { useUpdateKit } from "../mutations";
import { kitReducer, kitPickedIndices, type KitDraft } from "./kitDraft";
import { KitBrandingStep } from "./KitBrandingStep";

const STEPS = ["Products", "Branding"];

export function EditKitWizard() {
  const navigate = useNavigate();
  const { id } = useParams() as { id: string };
  const { data: workspace, isLoading } = useWorkspace();
  const updateKit = useUpdateKit();
  const [step, setStep] = useState<0 | 1>(0);
  const [saving, setSaving] = useState(false);

  const catalog: UiProduct[] = useMemo(() => workspace?.catalogProducts ?? [], [workspace]);
  const kit = workspace?.kits.find((k) => k.id === id);

  const initial = useMemo<KitDraft>(() => {
    if (!kit) {
      return {
        name: "",
        desc: "",
        picked: [],
        art: null,
        placements: {},
        notes: "",
        packaging: "box",
      };
    }
    return {
      name: kit.name,
      desc: "",
      picked: kitPickedIndices(kit, catalog),
      art: kit.artworkUrl ? { name: "Kit artwork", preview: kit.artworkUrl, existing: true } : null,
      placements: {},
      notes: kit.designNotes || "",
      packaging: kit.packaging === "none" ? "none" : "box",
    };
  }, [kit, catalog]);

  const [draft, dispatch] = useReducer(kitReducer, initial);

  if (isLoading && !workspace) {
    return <LoadingState message="Loading kit…" fullScreen={false} />;
  }
  if (!kit) {
    return (
      <div className="card" style={{ padding: 16 }}>
        Kit not found.{" "}
        <button type="button" className="lnk" onClick={() => navigate("/app/kits")}>
          Back to kits
        </button>
      </div>
    );
  }
  if (saving || updateKit.isPending) {
    return <LoadingState message="Saving kit…" fullScreen={false} />;
  }

  const selected = draft.picked.map((i) => catalog[i]).filter(Boolean) as UiProduct[];
  const pickedProducts = selected;

  function exit() {
    navigate("/app/kits");
  }

  async function save() {
    if (!draft.picked.length) {
      toast.error("Add at least one product to the kit");
      return;
    }
    setSaving(true);
    try {
      await updateKit.mutateAsync({
        id: id,
        name: draft.name,
        pickedIndices: draft.picked,
        catalog,
        designNotes: draft.notes,
        artwork: draft.art?.file
          ? { file: draft.art.file, preview: draft.art.preview, name: draft.art.name }
          : undefined,
      });
      toast.success("Kit updated");
      exit();
    } catch (err) {
      setSaving(false);
      toast.error(err instanceof Error ? err.message : "Failed to update kit");
    }
  }

  if (step === 0) {
    return (
      <WizardChrome
        title="Edit kit"
        steps={STEPS}
        activeIndex={0}
        onExit={exit}
        exitLabel="Cancel"
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <button
              type="button"
              className="lnk"
              style={{ background: "none", border: "none", cursor: "pointer" }}
              onClick={exit}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-dark"
              disabled={!draft.picked.length}
              onClick={() => setStep(1)}
            >
              Next
            </button>
          </div>
        }
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h1 style={{ fontSize: 26, marginBottom: 6 }}>Edit kit</h1>
          <p className="muted" style={{ marginBottom: 20 }}>
            Update the kit name and choose which catalog products to include.
          </p>
          <div className="field" style={{ maxWidth: 420, marginBottom: 24 }}>
            <label className="lbl">Kit name</label>
            <input
              className="inp"
              value={draft.name}
              onChange={(e) => dispatch({ type: "setName", name: e.target.value })}
            />
          </div>

          {selected.length ? (
            <div style={{ marginBottom: 22 }}>
              <div className="lbl" style={{ marginBottom: 10 }}>
                Current items ({selected.length})
              </div>
              <div
                className="grid"
                style={{ gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))" }}
              >
                {draft.picked.map((catIdx) => {
                  const p = catalog[catIdx];
                  if (!p) return null;
                  return (
                    <div key={catIdx} className="pcard" style={{ position: "relative" }}>
                      <ProductThumb product={p} />
                      <div className="meta">
                        {p.brand && <div className="brand">{p.brand}</div>}
                        <div className="nm">{p.nm}</div>
                      </div>
                      <button
                        type="button"
                        className="xbtn"
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          background: "#fff",
                          boxShadow: "0 1px 4px rgba(0,0,0,.12)",
                        }}
                        aria-label="Remove"
                        onClick={() => dispatch({ type: "removePick", index: catIdx })}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="banner" style={{ marginBottom: 18 }}>
              No products in this kit yet. Add items from the catalog below.
            </div>
          )}

          <CatalogStep
            catalog={catalog}
            picked={draft.picked}
            onToggle={(index) => dispatch({ type: "togglePick", index })}
            title="Add from catalog"
            subtitle="Tap a product to add or remove it from this kit."
          />
        </div>
      </WizardChrome>
    );
  }

  return (
    <WizardChrome
      title="Edit kit"
      steps={STEPS}
      activeIndex={1}
      onExit={exit}
      exitLabel="Cancel"
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
            <b style={{ fontSize: 15, color: "var(--ink)" }}>{draft.name}</b>
            <span className="tag tag-soft" style={{ fontWeight: 700 }}>
              {draft.picked.length} item{draft.picked.length === 1 ? "" : "s"} selected
            </span>
          </div>
          <div className="row" style={{ gap: 12, alignItems: "center" }}>
            <button
              type="button"
              className="lnk"
              style={{ background: "none", border: "none", cursor: "pointer" }}
              onClick={() => setStep(0)}
            >
              Back to products
            </button>
            <button type="button" className="btn btn-brand" onClick={save}>
              Save changes
            </button>
          </div>
        </div>
      }
    >
      <KitBrandingStep
        stepBadge="Step 2 of 2 · Branding"
        products={pickedProducts}
        art={draft.art}
        placements={draft.placements}
        notes={draft.notes}
        onSetArt={(art) => dispatch({ type: "setArt", art })}
        onClearArt={() => dispatch({ type: "clearArt" })}
        onResetPlacements={() => dispatch({ type: "resetPlacements" })}
        onPlacementChange={(key, placement) => dispatch({ type: "setPlacement", key, placement })}
        onNotes={(notes) => dispatch({ type: "setNotes", notes })}
      />
    </WizardChrome>
  );
}
