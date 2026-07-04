import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Box, CheckCircle2, Pencil, Send } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/tenant/PageHeader";
import { DesignedProductThumb } from "@/features/swag/DesignedProductThumb";
import { useWorkspace } from "@/hooks/useWorkspace";
import { resolveMediaUrl } from "@/lib/mediaUrl";

export function KitDetailPage() {
  const { id } = useParams() as { id: string };
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const kit = workspace?.kits.find((k) => k.id === id);

  const products = useMemo(() => {
    if (!kit?.productRefs?.length) return [];
    const byId = new Map((workspace?.catalogProducts ?? []).map((p) => [p.id, p]));
    return kit.productRefs.map((ref) => ({
      name: ref.name,
      brand: ref.brand,
      img: byId.get(ref.catalogProductId),
    }));
  }, [kit, workspace?.catalogProducts]);

  if (isLoading && !workspace) {
    return <LoadingState message="Loading kit..." fullScreen={false} />;
  }

  if (isError || !workspace) {
    return (
      <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
        {error instanceof Error ? error.message : "Could not load kit"}
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="card empty" style={{ padding: 48 }}>
        <h3>Kit not found</h3>
        <p>This kit may have been removed.</p>
        <Link to="/app/kits" className="btn btn-soft" style={{ marginTop: 14 }}>
          Back to kits
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        to="/app/kits"
        className="lnk"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18 }}
      >
        <ArrowLeft size={15} /> Back to kits
      </Link>

      <PageHeader
        title={kit.name}
        subtitle={`A reusable ${kit.items}-item kit. Send it to new recipients any time without rebuilding.`}
        actions={
          <div className="row" style={{ gap: 10 }}>
            <Link to={`/app/kits/${kit.id}/edit`} className="btn btn-ghost">
              <Pencil size={15} /> Edit kit
            </Link>
            <Link to={`/app/kits/${kit.id}/send`} className="btn btn-brand">
              <Send size={15} /> Send this kit
            </Link>
          </div>
        }
      />

      <div style={{ maxWidth: 1120 }}>
        <div
          className="card"
          style={{
            padding: 24,
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) 180px 180px",
            gap: 18,
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
            {kit.artworkUrl ? (
              <div className="logo-chip" style={{ width: 64, height: 64, overflow: "hidden", padding: 6 }}>
                <img
                  src={resolveMediaUrl(kit.artworkUrl)}
                  alt=""
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                />
              </div>
            ) : (
              <div className="logo-chip" style={{ width: 64, height: 64 }} />
            )}
            <div style={{ minWidth: 0 }}>
              <div className="eyebrow" style={{ marginBottom: 5 }}>Kit artwork</div>
              <div style={{ fontWeight: 750, fontSize: 17 }}>Branded across all items</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>
                Artwork and products are saved in this reusable kit.
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 16, background: "var(--surface-2)" }}>
            <div className="row" style={{ gap: 10 }}>
              <Box size={18} color="var(--brand)" />
              <div>
                <div className="mut3" style={{ fontSize: 11, fontWeight: 700 }}>Items</div>
                <div className="num" style={{ fontWeight: 800 }}>{kit.items}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 16, background: "var(--surface-2)" }}>
            <div className="row" style={{ gap: 10 }}>
              <CheckCircle2 size={18} color="var(--brand)" />
              <div>
                <div className="mut3" style={{ fontSize: 11, fontWeight: 700 }}>Status</div>
                <div style={{ fontWeight: 800 }}>{kit.status === "live" ? "Live" : "Draft"}</div>
              </div>
            </div>
          </div>
        </div>

        <section className="card" style={{ padding: 24 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
            <div>
              <div className="eyebrow">Included products</div>
              <h2 style={{ fontSize: 20, marginTop: 5 }}>Products in this kit</h2>
            </div>
            <span className="muted" style={{ fontSize: 13 }}>
              {products.length} item{products.length === 1 ? "" : "s"}
            </span>
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))",
              gap: 16,
            }}
          >
            {products.map((p, i) => {
              const src = p.img
                ? resolveMediaUrl(p.img.mockupUrl) || resolveMediaUrl(p.img.imgUrl)
                : undefined;
              return (
                <div key={`${p.name}-${i}`} className="pcard" style={{ cursor: "default" }}>
                  {p.img && kit.artworkUrl ? (
                    <DesignedProductThumb product={p.img} artworkUrl={kit.artworkUrl} />
                  ) : (
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
                  )}
                  <div className="meta">
                    {p.brand && <div className="brand">{p.brand}</div>}
                    <div className="nm">{p.name}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
