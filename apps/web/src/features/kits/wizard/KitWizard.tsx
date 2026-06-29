import { useMemo, useReducer, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { LoadingState } from "@/components/LoadingState";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { UiProduct } from "@/services/mappers";
import { WizardChrome } from "@/features/swag/wizard/WizardChrome";
import { CatalogStep } from "@/features/swag/wizard/CatalogStep";
import { usePlatformKits } from "../hooks";
import { useCreateKit } from "../mutations";
import { kitReducer, type KitDraft } from "./kitDraft";
import { KitNameStep } from "./KitNameStep";
import { KitBrandingStep } from "./KitBrandingStep";
import { KitPackagingStep } from "./KitPackagingStep";

const STEPS = ["Name", "Products", "Branding", "Packaging"];

const INITIAL: KitDraft = {
  name: "Welcome Kit",
  desc: "",
  picked: [0, 2, 3],
  art: null,
  placements: {},
  notes: "",
  packaging: "box",
};

/** Map a platform template's product list onto catalog indices. */
function templateIndices(items: Array<{ catalogProductId: string }>, catalog: UiProduct[]) {
  const indices: number[] = [];
  for (const item of items) {
    const pid = String(item.catalogProductId ?? "");
    if (!pid) continue;
    const idx = catalog.findIndex((p) => p.id === pid);
    if (idx >= 0 && !indices.includes(idx)) indices.push(idx);
  }
  return indices;
}

export function KitWizard() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/app/kits/new" }) as { template?: string };
  const { data: workspace, isLoading } = useWorkspace();
  const { data: platformKits } = usePlatformKits();
  const createKit = useCreateKit();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [publishing, setPublishing] = useState(false);

  const catalog: UiProduct[] = useMemo(() => workspace?.catalogProducts ?? [], [workspace]);

  // Seed the draft from a pre-designed template when one is selected.
  const seeded = useMemo<KitDraft>(() => {
    const tpl = search.template
      ? platformKits?.find((k) => String(k._id) === String(search.template))
      : undefined;
    if (!tpl || !catalog.length) return INITIAL;
    const picked = templateIndices(tpl.items ?? [], catalog);
    return {
      ...INITIAL,
      name: tpl.name || INITIAL.name,
      desc: tpl.description || "",
      picked: picked.length ? picked : INITIAL.picked,
      packaging: tpl.packaging === "none" ? "none" : "box",
    };
  }, [search.template, platformKits, catalog]);

  const [draft, dispatch] = useReducer(kitReducer, seeded);

  if (isLoading && !workspace) {
    return <LoadingState message="Loading catalog…" fullScreen={false} />;
  }
  if (publishing || createKit.isPending) {
    return <LoadingState message="Publishing kit…" fullScreen={false} />;
  }

  const pickedProducts = draft.picked.map((i) => catalog[i]).filter(Boolean) as UiProduct[];

  function exit() {
    navigate({ to: "/app/kits" });
  }

  function next() {
    if (step === 0) {
      if (draft.name.trim().length < 4) {
        toast.error("Kit name must be at least 4 characters");
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (!draft.picked.length) {
        toast.error("Select at least one product");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  }

  async function publish() {
    setPublishing(true);
    try {
      const created = await createKit.mutateAsync({
        name: draft.name || "New Kit",
        pickedIndices: draft.picked,
        catalog,
        packaging: draft.packaging,
        designNotes: draft.notes,
        artwork: draft.art?.file
          ? { file: draft.art.file, preview: draft.art.preview, name: draft.art.name }
          : undefined,
      });
      toast.success(`Kit "${created.name}" saved to your workspace`);
      // Publish & send: hand off to the send-kit checkout (legacy flow).
      window.location.href = `/?view=kitsLaunch&launch=sendKit&kit=${encodeURIComponent(created.id)}`;
    } catch (err) {
      setPublishing(false);
      toast.error(err instanceof Error ? err.message : "Failed to save kit");
    }
  }

  const backLink = (label: string, to: 0 | 1 | 2) => (
    <button
      type="button"
      className="lnk"
      style={{ background: "none", border: "none", cursor: "pointer" }}
      onClick={() => setStep(to)}
    >
      {label}
    </button>
  );

  const kitTag = (suffix?: string) => (
    <span className="tag tag-soft" style={{ fontWeight: 700 }}>
      {draft.picked.length} item{draft.picked.length === 1 ? "" : "s"}
      {suffix ? ` · ${suffix}` : ""}
    </span>
  );

  const summaryFoot = (back: React.ReactNode, action: React.ReactNode, suffix?: string) => (
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
        {kitTag(suffix)}
      </div>
      <div className="row" style={{ gap: 12, alignItems: "center" }}>
        {back}
        {action}
      </div>
    </div>
  );

  if (step === 0) {
    return (
      <WizardChrome
        title="Create a kit"
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
            <button type="button" className="btn btn-dark" onClick={next}>
              Next
            </button>
          </div>
        }
      >
        <KitNameStep
          name={draft.name}
          desc={draft.desc}
          onName={(name) => dispatch({ type: "setName", name })}
          onDesc={(desc) => dispatch({ type: "setDesc", desc })}
        />
      </WizardChrome>
    );
  }

  if (step === 1) {
    return (
      <WizardChrome
        title="Create a kit"
        steps={STEPS}
        activeIndex={1}
        onExit={exit}
        exitLabel="Cancel"
        footer={summaryFoot(
          backLink("Back", 0),
          <button
            type="button"
            className="btn btn-dark"
            disabled={!draft.picked.length}
            onClick={next}
          >
            Next
          </button>,
        )}
      >
        <CatalogStep
          catalog={catalog}
          picked={draft.picked}
          onToggle={(index) => dispatch({ type: "togglePick", index })}
          title={`Choose products for "${draft.name}"`}
          subtitle="Select the items to include. You can brand them in the next step."
        />
      </WizardChrome>
    );
  }

  if (step === 2) {
    return (
      <WizardChrome
        title="Create a kit"
        steps={STEPS}
        activeIndex={2}
        onExit={exit}
        exitLabel="Cancel"
        footer={summaryFoot(
          backLink("Back to products", 1),
          <button type="button" className="btn btn-brand" onClick={next}>
            Continue <ArrowRight size={14} />
          </button>,
          undefined,
        )}
      >
        <KitBrandingStep
          stepBadge="Step 3 of 4 · Branding"
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

  return (
    <WizardChrome
      title="Create a kit"
      steps={STEPS}
      activeIndex={3}
      onExit={exit}
      exitLabel="Cancel"
      footer={summaryFoot(
        backLink("Back to branding", 2),
        <button type="button" className="btn btn-brand" onClick={publish}>
          Publish kit &amp; send
        </button>,
        draft.packaging === "none" ? "Standard mailer" : "Premium box",
      )}
    >
      <KitPackagingStep
        kitName={draft.name}
        itemCount={draft.picked.length}
        packaging={draft.packaging}
        onPackaging={(packaging) => dispatch({ type: "setPackaging", packaging })}
      />
    </WizardChrome>
  );
}
