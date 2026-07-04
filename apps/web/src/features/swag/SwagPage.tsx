import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { LayoutGrid, Plus, Rows3, Shirt } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/tenant/PageHeader";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import type { UiCollection, UiProduct } from "@/services/mappers";
import { CollectionBlock } from "./CollectionBlock";
import { DesignCard } from "./DesignCard";
import { ProductDetailDialog, type DesignTarget } from "./ProductDetailDialog";
import { AddToShopDialog, type AddToShopTarget } from "./AddToShopDialog";
import swagBannerImg from "../../../assets/swag-banner.png";
import startDesigningImg from "../../../assets/start_designing.png";

type Tab = "All Products" | "Saved Designs" | "Archived";
type View = "product" | "collection";

export function SwagPage() {
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const { canWrite } = useTenantAccess();
  const canDesignSwag = canWrite("swag");
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("All Products");
  const [view, setView] = useState<View>("product");
  const [design, setDesign] = useState<DesignTarget | null>(null);
  const [addTarget, setAddTarget] = useState<AddToShopTarget | null>(null);

  const collections = useMemo(
    () => (workspace?.collections ?? []).filter((c) => !c.isShopSpecific),
    [workspace?.collections],
  );
  const active = collections.filter((c) => c.status !== "archived");
  const archived = collections.filter((c) => c.status === "archived");
  const shown = tab === "Archived" ? archived : active;

  const designEntries = useMemo(() => {
    const seen = new Set<string>();
    const out: { collection: UiCollection; product: UiProduct; pIdx: number }[] = [];
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

  if (isLoading && !workspace) {
    return <LoadingState message="Loading swag…" fullScreen={false} />;
  }
  if (isError || !workspace) {
    return (
      <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
        {error instanceof Error ? error.message : "Could not load swag"}
      </div>
    );
  }

  const tabLabels: Record<Tab, string> = {
    "All Products": `All Products (${designEntries.length || 0})`,
    "Saved Designs": "Saved Designs",
    Archived: "Archived",
  };

  function selectTab(t: Tab) {
    setTab(t);
    setView(t === "All Products" ? "product" : "collection");
  }

  const empty = shown.length === 0;

  return (
    <>
      <PageHeader
        title="Swag"
        subtitle="Your designed collections and the full catalog you can build from."
        actions={
          <>
            {canDesignSwag ? (
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

      <div
        className="swag-hero-banner"
        style={{ backgroundImage: `url(${swagBannerImg})` }}
        role="img"
        aria-label="Build your swag collection"
      />

      <div
        className="row"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 22,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div
          className="tabs"
          style={{ flex: 1, minWidth: 280, maxWidth: 520 }}
          role="tablist"
          aria-label="Swag filter"
        >
          {(["All Products", "Saved Designs", "Archived"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={t === tab}
              className={t === tab ? "on" : ""}
              onClick={() => selectTab(t)}
            >
              {tabLabels[t]}
            </button>
          ))}
        </div>
        <TooltipProvider delayDuration={150}>
          <div className="view-toggle">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={`view-toggle-btn ${view === "product" ? "on" : ""}`}
                  aria-label="View by product"
                  aria-pressed={view === "product"}
                  onClick={() => setView("product")}
                >
                  <LayoutGrid size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={10} className="view-toggle-tip">
                View by product
                <TooltipArrow className="view-toggle-tip-arrow" width={12} height={6} />
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={`view-toggle-btn ${view === "collection" ? "on" : ""}`}
                  aria-label="View by collection"
                  aria-pressed={view === "collection"}
                  onClick={() => setView("collection")}
                >
                  <Rows3 size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={10} className="view-toggle-tip">
                View by collection
                <TooltipArrow className="view-toggle-tip-arrow" width={12} height={6} />
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {empty ? (
        tab === "Archived" ? (
          <div className="card empty" style={{ padding: 48 }}>
            <div className="ic" aria-hidden="true">
              <Shirt size={34} color="#cdd6cf" />
            </div>
            <h3>No archived designs</h3>
            <p>Designs you archive will be stored here and can be restored any time.</p>
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
            {canDesignSwag ? (
              <button
                type="button"
                className="btn btn-dark btn-lg"
                style={{ padding: "0 20px", position: "absolute", bottom: 24, left: 80, zIndex: 10 }}
                onClick={() => navigate("/app/swag/new")}
              >
                <Plus size={16} /> Start designing
              </button>
            ) : null}
          </div>
        )
      ) : view === "product" ? (
        <div className="grid swag-designs-grid">
          {designEntries.map(({ collection, product, pIdx }) => (
            <DesignCard
              key={`${collection.id}:${pIdx}`}
              collection={collection}
              product={product}
              productView
              onOpen={() => setDesign({ collection, product, pIdx })}
              onEditDesign={() => navigate("/app/swag/new")}
              onViewProduct={() => {
                if (product.id) {
                  navigate(`/app/catalog/${product.id}`);
                } else {
                  setDesign({ collection, product, pIdx });
                }
              }}
              onAddToShop={() => setAddTarget({ collection, product })}
            />
          ))}
        </div>
      ) : (
        shown.map((col) => (
          <CollectionBlock
            key={col.id}
            collection={col}
            onOpenDesign={(product, pIdx) => setDesign({ collection: col, product, pIdx })}
            onAddToShop={(collection) => setAddTarget({ collection })}
          />
        ))
      )}

      <ProductDetailDialog
        target={design}
        onOpenChange={(open) => !open && setDesign(null)}
        onAddToShop={(t) => {
          setDesign(null);
          setAddTarget({ collection: t.collection, product: t.product });
        }}
      />
      <AddToShopDialog target={addTarget} onOpenChange={(open) => !open && setAddTarget(null)} />
    </>
  );
}
