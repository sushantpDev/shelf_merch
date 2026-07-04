import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import type { UiCollection, UiProduct } from "../model";
import type { DesignTarget } from "../ProductDetailDialog";
import type { AddToShopTarget } from "../AddToShopDialog";

export type SwagTab = "All Products" | "Saved Designs" | "Archived";
export type SwagView = "product" | "collection";

export type DesignEntry = { collection: UiCollection; product: UiProduct; pIdx: number };

export type SwagVm = {
  isLoading: boolean;
  errorMessage: string | null;
  canDesignSwag: boolean;
  tab: SwagTab;
  view: SwagView;
  shown: UiCollection[];
  designEntries: DesignEntry[];
  empty: boolean;
  design: DesignTarget | null;
  addTarget: AddToShopTarget | null;
  onSelectTab: (tab: SwagTab) => void;
  onSetView: (view: SwagView) => void;
  onStartDesigning: () => void;
  onOpenDesign: (target: DesignTarget) => void;
  onCloseDesign: () => void;
  onSetAddTarget: (target: AddToShopTarget | null) => void;
  onEditDesign: () => void;
  onViewCatalog: (productId: string) => void;
  onDesignAddToShop: (target: DesignTarget) => void;
};

/** Controller for the swag library: tab/view state, design + add-to-shop dialogs. */
export function useSwagController(): SwagVm {
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const { canWrite } = useTenantAccess();
  const navigate = useNavigate();
  const [tab, setTab] = useState<SwagTab>("All Products");
  const [view, setView] = useState<SwagView>("product");
  const [design, setDesign] = useState<DesignTarget | null>(null);
  const [addTarget, setAddTarget] = useState<AddToShopTarget | null>(null);

  const collections = useMemo(
    () => (workspace?.collections ?? []).filter((c) => !c.isShopSpecific),
    [workspace?.collections],
  );
  const active = collections.filter((c) => c.status !== "archived");
  const archived = collections.filter((c) => c.status === "archived");
  const shown = tab === "Archived" ? archived : active;

  const designEntries = useMemo<DesignEntry[]>(() => {
    const seen = new Set<string>();
    const out: DesignEntry[] = [];
    for (const col of shown) {
      col.products.forEach((p, i) => {
        const key = `${p.id || ""}|${col.artworkUrl || ""}|${p.nm}`;
        if (seen.has(key)) return;
        seen.add(key);
        out.push({ collection: col, product: p, pIdx: i });
      });
    }
    return out;
  }, [shown]);

  function onSelectTab(t: SwagTab) {
    setTab(t);
    setView(t === "All Products" ? "product" : "collection");
  }

  return {
    isLoading: isLoading && !workspace,
    errorMessage:
      isError || !workspace
        ? error instanceof Error
          ? error.message
          : "Could not load swag"
        : null,
    canDesignSwag: canWrite("swag"),
    tab,
    view,
    shown,
    designEntries,
    empty: shown.length === 0,
    design,
    addTarget,
    onSelectTab,
    onSetView: setView,
    onStartDesigning: () => navigate("/app/swag/new"),
    onOpenDesign: setDesign,
    onCloseDesign: () => setDesign(null),
    onSetAddTarget: setAddTarget,
    onEditDesign: () => navigate("/app/swag/new"),
    onViewCatalog: (productId) => navigate(`/app/catalog/${productId}`),
    onDesignAddToShop: (t) => {
      setDesign(null);
      setAddTarget({ collection: t.collection, product: t.product });
    },
  };
}
