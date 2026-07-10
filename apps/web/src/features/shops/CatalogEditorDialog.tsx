import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { UiProduct, UiShop } from "@/services/mappers";
import { ProductThumb } from "./ProductThumb";
import { useUpdateShop } from "./model";
import { catalogCategoryLabel, catalogProductKey } from "./types";

export function CatalogEditorDialog({
  shop,
  products,
  open,
  onOpenChange,
}: {
  shop: UiShop;
  products: UiProduct[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateShop = useUpdateShop();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState("All Products");
  const [search, setSearch] = useState("");
  const [viewSelected, setViewSelected] = useState(false);

  useEffect(() => {
    if (open) {
      setPicked(new Set(shop.selectedCatalogProductIds || []));
      setCategory("All Products");
      setSearch("");
      setViewSelected(false);
    }
  }, [open, shop.selectedCatalogProductIds]);

  const indexed = useMemo(
    () => products.map((p, i) => ({ p, key: catalogProductKey(p, i) })),
    [products],
  );

  const categories = useMemo(() => {
    const set = new Set<string>(["All Products"]);
    products.forEach((p) => set.add(catalogCategoryLabel(p)));
    return [...set];
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return indexed.filter(({ p, key }) => {
      if (viewSelected && !picked.has(key)) return false;
      if (category !== "All Products" && catalogCategoryLabel(p) !== category) return false;
      if (q && !`${p.nm} ${p.brand || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [indexed, picked, category, search, viewSelected]);

  function toggle(key: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function save() {
    const ids = [...picked].filter((id) => !id.startsWith("demo:"));
    const enabled = new Set(ids);
    const featuredCatalogProductIds = (shop.featuredCatalogProductIds || []).filter((id) =>
      enabled.has(id),
    );
    try {
      await updateShop.mutateAsync({
        shopId: shop.id,
        input: { selectedCatalogProductIds: ids, featuredCatalogProductIds },
      });
      toast.success("Shop catalog updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save catalog selection");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm-modal sm-catalog-modal">
        <div className="sm-catalog-modal-inner">
          <div className="sm-catalog-modal-head">
            <DialogTitle>Edit catalog</DialogTitle>
            <p className="muted sm-catalog-modal-sub">
              Hide or show products in <b>{shop.name}</b>. Deselected items will not appear on the
              live shop.
            </p>
            {picked.size === 0 ? (
              <div className="sm-catalog-modal-warn">
                No products selected. Enable some so recipients can shop them.
              </div>
            ) : null}
          </div>

          <div className="sm-catalog-modal-body">
            <aside className="sm-catalog-modal-rail">
              {categories.map((c) => {
                const entries = indexed.filter(
                  ({ p }) => c === "All Products" || catalogCategoryLabel(p) === c,
                );
                const sel = entries.filter(({ key }) => picked.has(key)).length;
                return (
                  <button
                    key={c}
                    type="button"
                    className={`item ${category === c ? "on" : ""}`}
                    onClick={() => setCategory(c)}
                  >
                    <span className="item-label">{c}</span>
                    <span className="ct">
                      ({sel}/{entries.length})
                    </span>
                  </button>
                );
              })}
            </aside>

            <div className="sm-catalog-modal-main">
              <div className="sm-catalog-modal-toolbar">
                <div className="search sm-catalog-modal-search">
                  <Search size={16} aria-hidden="true" />
                  <input
                    aria-label="Search products"
                    placeholder="Search products"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="sm-catalog-modal-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setPicked(new Set())}
                  >
                    Deselect all
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() =>
                      setPicked((prev) => {
                        const next = new Set(prev);
                        filtered.forEach(({ key }) => next.add(key));
                        return next;
                      })
                    }
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    className={`btn btn-ghost btn-sm ${viewSelected ? "on" : ""}`}
                    onClick={() => setViewSelected((v) => !v)}
                  >
                    {viewSelected ? "View all" : "View selected"}
                  </button>
                </div>
              </div>

              <div className="sm-catalog-modal-grid">
                {filtered.length === 0 ? (
                  <p className="muted" style={{ padding: "16px 0" }}>
                    No products match your filters.
                  </p>
                ) : (
                  filtered.map(({ p, key }) => {
                    const on = picked.has(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`pcard sm-catalog-product${on ? " on" : ""}`}
                        aria-pressed={on}
                        onClick={() => toggle(key)}
                      >
                        <div className={`sm-catalog-check${on ? " on" : ""}`}>{on ? "✓" : ""}</div>
                        <ProductThumb product={p} />
                        <div className="meta">
                          {p.brand ? <div className="brand">{p.brand}</div> : null}
                          <div className="nm">{p.nm}</div>
                          <div className="pr">{p.price || ""}</div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="sm-catalog-modal-footer">
            <span className="mut3">
              {picked.size} of {products.length} selected
            </span>
            <div className="row" style={{ gap: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-brand"
                disabled={updateShop.isPending}
                onClick={save}
              >
                {updateShop.isPending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
