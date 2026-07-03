import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, Shirt } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { ViewToggle } from "@/components/ViewToggle";
import { PageHeader } from "@/components/tenant/PageHeader";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import type { UiCollection, UiProduct } from "@/services/mappers";
import { AddToShopDialog, type AddToShopTarget } from "./AddToShopDialog";
import { CollectionBlock } from "./CollectionBlock";
import { DesignCard } from "./DesignCard";
import { swagProductPath } from "./paths";

const LOCKER_ITEMS: [string, number][] = [
  ["Mercer+Mettle Pack", 42],
  ["Bella + Canvas Hoodie", 88],
  ["Black Glossy Mug 11oz", 120],
  ["The Standard Bottle", 64],
];

type Tab = "all" | "saved" | "locker";
type View = "product" | "collection";

export function SwagPage() {
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const { canWrite } = useTenantAccess();
  const canDesignSwag = canWrite("swag");
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("all");
  const [view, setView] = useState<View>("collection");
  const [addTarget, setAddTarget] = useState<AddToShopTarget | null>(null);

  const collections = useMemo(
    () => (workspace?.collections ?? []).filter((c) => !c.isShopSpecific),
    [workspace?.collections],
  );
  const active = collections.filter((c) => c.status !== "archived");

  const designEntries = useMemo(() => {
    const seen = new Set<string>();
    const out: { collection: UiCollection; product: UiProduct; pIdx: number }[] = [];
    for (const col of active) {
      col.products.forEach((p, i) => {
        const key = `${p.id || ""}|${col.artworkUrl || ""}|${p.nm}`;
        if (seen.has(key)) return;
        seen.add(key);
        out.push({ collection: col, product: p, pIdx: i });
      });
    }
    return out;
  }, [active]);

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

  const showCollectionView = tab === "all" && view === "collection";
  const showProductGrid = tab === "saved" || (tab === "all" && view === "product");
  const empty = active.length === 0;

  return (
    <div className="swag-page">
      <PageHeader
        title="Swag"
        actions={
          <>
            {canDesignSwag ? (
              <Link to="/app/swag/new" className="btn btn-ghost btn-sm swag-page-cta">
                <Plus size={15} aria-hidden />
                Start designing
              </Link>
            ) : null}
            <Link to="/app/catalog" className="btn btn-dark btn-sm swag-page-cta">
              Purchase Swag
            </Link>
          </>
        }
      />

      <div className="swag-page-toolbar">
        <div className="swag-page-tabs" role="tablist" aria-label="Swag views">
          <button
            type="button"
            role="tab"
            className={`swag-page-tab ${tab === "all" ? "on" : ""}`}
            aria-selected={tab === "all"}
            onClick={() => setTab("all")}
          >
            All Products
          </button>
          <button
            type="button"
            role="tab"
            className={`swag-page-tab ${tab === "saved" ? "on" : ""}`}
            aria-selected={tab === "saved"}
            onClick={() => setTab("saved")}
          >
            Saved Designs
          </button>
          <button
            type="button"
            role="tab"
            className={`swag-page-tab ${tab === "locker" ? "on" : ""}`}
            aria-selected={tab === "locker"}
            onClick={() => setTab("locker")}
          >
            Locker Inventory
          </button>
        </div>

        {tab === "all" && (
          <ViewToggle
            value={view}
            onChange={setView}
            options={[
              { value: "collection", label: "Collection view", icon: "grid" },
              { value: "product", label: "Product view", icon: "list" },
            ]}
          />
        )}
      </div>

      {tab === "locker" ? (
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 17, marginBottom: 14 }}>Locker inventory</h3>
          <table className="tbl">
            <thead>
              <tr>
                <th>Item</th>
                <th>In locker</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {LOCKER_ITEMS.map(([name, qty]) => (
                <tr key={name}>
                  <td style={{ fontWeight: 600 }}>{name}</td>
                  <td className="num">{qty}</td>
                  <td>
                    {qty < 50 ? (
                      <span className="tag tag-warn">
                        <span className="dot" />
                        Low
                      </span>
                    ) : (
                      <span className="tag tag-live">
                        <span className="dot" />
                        Healthy
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : empty ? (
        <EmptySwag canDesign={canDesignSwag} />
      ) : showCollectionView ? (
        <div className="swag-collections-list">
          {active.map((col) => (
            <CollectionBlock
              key={col.id}
              collection={col}
              onOpenDesign={(_product, pIdx) => navigate(swagProductPath(col.id, pIdx))}
              onAddToShop={(collection) => setAddTarget({ collection })}
              onEditDesign={() => navigate({ to: "/app/swag/new" })}
              onViewProduct={(product, pIdx) => {
                if (product.id) {
                  navigate({ to: "/app/catalog/$id", params: { id: product.id } });
                } else {
                  navigate(swagProductPath(col.id, pIdx));
                }
              }}
            />
          ))}
        </div>
      ) : showProductGrid ? (
        <div className="swag-designs-grid">
          {designEntries.map(({ collection, product, pIdx }) => (
            <DesignCard
              key={`${collection.id}:${pIdx}`}
              collection={collection}
              product={product}
              productView
              onOpen={() => navigate(swagProductPath(collection.id, pIdx))}
              onEditDesign={() => navigate({ to: "/app/swag/new" })}
              onViewProduct={() => {
                if (product.id) {
                  navigate({ to: "/app/catalog/$id", params: { id: product.id } });
                } else {
                  navigate(swagProductPath(collection.id, pIdx));
                }
              }}
              onAddToShop={() => setAddTarget({ collection, product })}
            />
          ))}
        </div>
      ) : null}

      <AddToShopDialog target={addTarget} onOpenChange={(open) => !open && setAddTarget(null)} />
    </div>
  );
}

function EmptySwag({ canDesign }: { canDesign: boolean }) {
  return (
    <div className="card empty" style={{ padding: 48 }}>
      <div className="ic" aria-hidden="true">
        <Shirt size={34} color="#cdd6cf" />
      </div>
      <h3>No swag designs yet</h3>
      <p>Create your first branded collection to get started.</p>
      {canDesign ? (
        <Link to="/app/swag/new" className="btn btn-dark btn-lg swag-page-cta" style={{ marginTop: 14 }}>
          <Plus size={16} aria-hidden />
          Start designing
        </Link>
      ) : null}
    </div>
  );
}
