import { Link } from "react-router";
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
import { CollectionBlock } from "../CollectionBlock";
import { DesignCard } from "../DesignCard";
import { ProductDetailDialog } from "../ProductDetailDialog";
import { AddToShopDialog } from "../AddToShopDialog";
import type { SwagTab, SwagVm } from "../controllers/useSwagController";
import startDesigningImg from "../../../../assets/start_designing.png";

const TABS: SwagTab[] = ["All Products", "Saved Designs", "Archived"];

/** Swag library: header, banner, tab + view-toggle, product/collection grids, dialogs. */
export function SwagView(vm: SwagVm) {
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

  const tabLabels: Record<SwagTab, string> = {
    "All Products": `All Products (${vm.designEntries.length || 0})`,
    "Saved Designs": "Saved Designs",
    Archived: "Archived",
  };

  return (
    <>
      <PageHeader
        title="Swag"
        subtitle="Your designed collections and the full catalog you can build from."
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

      {/* TODO: assets/swag-banner.png was never committed — add it and restore the backgroundImage here. */}
      <div className="swag-hero-banner" role="img" aria-label="Build your swag collection" />

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
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={t === vm.tab}
              className={t === vm.tab ? "on" : ""}
              onClick={() => vm.onSelectTab(t)}
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
                  className={`view-toggle-btn ${vm.view === "product" ? "on" : ""}`}
                  aria-label="View by product"
                  aria-pressed={vm.view === "product"}
                  onClick={() => vm.onSetView("product")}
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
                  className={`view-toggle-btn ${vm.view === "collection" ? "on" : ""}`}
                  aria-label="View by collection"
                  aria-pressed={vm.view === "collection"}
                  onClick={() => vm.onSetView("collection")}
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

      {vm.empty ? (
        vm.tab === "Archived" ? (
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
      ) : vm.view === "product" ? (
        <div className="grid swag-designs-grid">
          {vm.designEntries.map(({ collection, product, pIdx }) => (
            <DesignCard
              key={`${collection.id}:${pIdx}`}
              collection={collection}
              product={product}
              productView
              onOpen={() => vm.onOpenDesign({ collection, product, pIdx })}
              onEditDesign={vm.onEditDesign}
              onViewProduct={() => {
                if (product.id) vm.onViewCatalog(product.id);
                else vm.onOpenDesign({ collection, product, pIdx });
              }}
              onAddToShop={() => vm.onSetAddTarget({ collection, product })}
            />
          ))}
        </div>
      ) : (
        vm.shown.map((col) => (
          <CollectionBlock
            key={col.id}
            collection={col}
            onOpenDesign={(product, pIdx) => vm.onOpenDesign({ collection: col, product, pIdx })}
            onAddToShop={(collection) => vm.onSetAddTarget({ collection })}
            onEditDesign={vm.onEditDesign}
            onViewProduct={(product, pIdx) => {
              if (product.id) vm.onViewCatalog(product.id);
              else vm.onOpenDesign({ collection: col, product, pIdx });
            }}
          />
        ))
      )}

      <ProductDetailDialog
        target={vm.design}
        onOpenChange={(open) => !open && vm.onCloseDesign()}
        onAddToShop={vm.onDesignAddToShop}
      />
      <AddToShopDialog
        target={vm.addTarget}
        onOpenChange={(open) => !open && vm.onSetAddTarget(null)}
      />
    </>
  );
}
