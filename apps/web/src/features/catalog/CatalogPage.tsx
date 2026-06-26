import { useMemo, useState } from "react";
import { PageHeader } from "@/components/tenant/PageHeader";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { UiProduct } from "@/services/mappers";
import { ProductCard } from "./ProductCard";
import { ProductQuickView } from "./ProductQuickView";
import { useCatalog } from "./hooks";
import { ALL_PRODUCTS, CATALOG_CATEGORIES } from "./types";

const GRID_STYLE = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
  gap: 16,
} as const;

function CatalogSkeleton() {
  return (
    <div className="sm-skeleton-grid" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="sm-skeleton-card">
          <div className="sm-skeleton-img" />
          <div className="sm-skeleton-line" />
          <div className="sm-skeleton-line short" />
        </div>
      ))}
    </div>
  );
}

export function CatalogPage() {
  const { data: workspace } = useWorkspace();
  const [category, setCategory] = useState<string>(ALL_PRODUCTS);
  const [selected, setSelected] = useState<{ product: UiProduct; index: number } | null>(null);

  const seed = useMemo(
    () =>
      workspace ? { items: workspace.catalogProducts, total: workspace.catalogTotal } : undefined,
    [workspace],
  );

  const { data, isLoading, isError, error, isFetching } = useCatalog(category, seed);
  const items = data?.items ?? [];
  const count = data?.total ?? items.length;

  return (
    <>
      <PageHeader
        title="Catalog"
        subtitle={`${count} products from vetted suppliers, ready to brand and ship across India.`}
      />

      <div
        className="tabs"
        style={{ marginBottom: 20 }}
        role="tablist"
        aria-label="Product categories"
      >
        {CATALOG_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={c === category}
            className={c === category ? "on" : ""}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {(isLoading || isFetching) && items.length === 0 ? (
        <CatalogSkeleton />
      ) : isError ? (
        <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
          {error instanceof Error ? error.message : "Could not load catalog products"}
        </div>
      ) : items.length === 0 ? (
        <div className="card empty" style={{ padding: 48, textAlign: "center" }}>
          <h3>No products in this category</h3>
          <p className="muted">Try another category.</p>
        </div>
      ) : (
        <div style={GRID_STYLE}>
          {items.map((p, index) => (
            <ProductCard
              key={p.id ?? `${p.nm}-${index}`}
              product={p}
              onOpen={() => setSelected({ product: p, index })}
            />
          ))}
        </div>
      )}

      <ProductQuickView selected={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  );
}
