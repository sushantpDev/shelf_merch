import { useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { UiKit, UiProduct } from "@/services/mappers";
import { kitLaunch } from "./hooks";

export function KitDetailDialog({
  kit,
  catalog,
  onOpenChange,
}: {
  kit: UiKit | null;
  catalog: UiProduct[];
  onOpenChange: (open: boolean) => void;
}) {
  const products = useMemo(() => {
    if (!kit?.productRefs?.length) return [];
    const byId = new Map(catalog.map((p) => [p.id, p]));
    return kit.productRefs.map((ref) => ({
      name: ref.name,
      brand: ref.brand,
      img: byId.get(ref.catalogProductId),
    }));
  }, [kit, catalog]);

  return (
    <Dialog open={kit !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm-modal" style={{ maxWidth: 640 }}>
        {kit && (
          <div className="modal-pad">
            <div className="eyebrow">
              {kit.status} · {kit.items} items
            </div>
            <DialogTitle style={{ fontSize: 20 }}>{kit.name}</DialogTitle>
            <p className="muted" style={{ margin: "8px 0 0" }}>
              A reusable {kit.items}-item kit. Send it to new recipients any time without
              rebuilding.
            </p>

            {kit.artworkUrl && (
              <div style={{ margin: "12px 0 16px" }}>
                <div
                  className="mut3"
                  style={{
                    fontSize: 10,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  Kit artwork
                </div>
                <div className="row" style={{ gap: 12, alignItems: "center" }}>
                  <div
                    className="logo-chip"
                    style={{ width: 48, height: 48, overflow: "hidden", padding: 4 }}
                  >
                    <img
                      src={resolveMediaUrl(kit.artworkUrl)}
                      alt=""
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                    />
                  </div>
                  <span className="muted" style={{ fontSize: 13 }}>
                    Branded across all items
                  </span>
                </div>
              </div>
            )}

            {products.length > 0 && (
              <div style={{ margin: "12px 0 16px" }}>
                <div
                  className="mut3"
                  style={{
                    fontSize: 10,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  Included products
                </div>
                <div
                  className="grid"
                  style={{ gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 12 }}
                >
                  {products.map((p, i) => {
                    const src = p.img
                      ? resolveMediaUrl(p.img.mockupUrl) || resolveMediaUrl(p.img.imgUrl)
                      : undefined;
                    return (
                      <div key={`${p.name}-${i}`} className="pcard">
                        <div className="img">
                          {src ? (
                            <img
                              src={src}
                              alt={p.name}
                              loading="lazy"
                              style={{ width: "100%", height: "100%", objectFit: "contain" }}
                            />
                          ) : (
                            <div
                              className="sm-skeleton-img"
                              aria-hidden="true"
                              style={{ width: "100%", height: "100%" }}
                            />
                          )}
                        </div>
                        <div className="meta">
                          {p.brand && <div className="brand">{p.brand}</div>}
                          <div className="nm">{p.name}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="row" style={{ marginTop: 16 }}>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => kitLaunch.edit(kit.id)}
              >
                Edit kit
              </button>
              <button
                type="button"
                className="btn btn-brand btn-block"
                onClick={() => kitLaunch.send(kit.id)}
              >
                Send this kit
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
