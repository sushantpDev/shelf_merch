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
    try {
      await updateShop.mutateAsync({ shopId: shop.id, input: { selectedCatalogProductIds: ids } });
      toast.success("Shop catalog updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save catalog selection");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm-modal" style={{ maxWidth: "min(1140px,96vw)", width: "100%" }}>
        <div className="modal-pad">
          <DialogTitle>Edit catalog</DialogTitle>
          <p className="muted" style={{ marginTop: 4, fontSize: 13 }}>
            Select products to show in <b>{shop.name}</b>
          </p>
          {picked.size === 0 && (
            <div
              className="banner"
              style={{
                marginTop: 12,
                borderColor: "#f3c4cb",
                background: "#fff5f6",
                color: "#9b1c1c",
              }}
            >
              <div>
                Your current selection shows no available products. Enable some before sending
                points.
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 20, marginTop: 18, minHeight: 380 }}>
            <div
              className="subrail"
              style={{ width: 210, flex: "none", maxHeight: "58vh", overflow: "auto" }}
            >
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
                    {c}
                    <span className="ct">
                      ({sel}/{entries.length})
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                <div className="search" style={{ flex: 1, minWidth: 220 }}>
                  <Search size={16} aria-hidden="true" />
                  <input
                    aria-label="Search products"
                    placeholder="Search products"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
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

              <div
                className="grid"
                style={{
                  gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))",
                  maxHeight: "55vh",
                  overflow: "auto",
                  paddingRight: 4,
                  gap: 12,
                }}
              >
                {filtered.length === 0 ? (
                  <p className="muted" style={{ padding: "20px 0" }}>
                    No products match your filters.
                  </p>
                ) : (
                  filtered.map(({ p, key }) => {
                    const on = picked.has(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        className="pcard"
                        style={{
                          position: "relative",
                          cursor: "pointer",
                          textAlign: "left",
                          ...(on
                            ? {
                                borderColor: "var(--brand)",
                                boxShadow: "0 0 0 2px var(--brand-50)",
                              }
                            : {}),
                        }}
                        aria-pressed={on}
                        onClick={() => toggle(key)}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            zIndex: 2,
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            background: on ? "var(--brand)" : "#fff",
                            border: `2px solid ${on ? "var(--brand)" : "var(--line)"}`,
                            display: "grid",
                            placeItems: "center",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {on ? "✓" : ""}
                        </div>
                        <ProductThumb product={p} />
                        <div className="meta">
                          {p.brand && <div className="brand">{p.brand}</div>}
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

          <div
            className="row"
            style={{
              justifyContent: "space-between",
              marginTop: 22,
              paddingTop: 16,
              borderTop: "1px solid var(--line)",
              alignItems: "center",
            }}
          >
            <span className="mut3">
              {picked.size} of {products.length} selected
            </span>
            <div className="row" style={{ gap: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-dark"
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
