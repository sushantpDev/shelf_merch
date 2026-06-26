import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Coins } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { UiShop } from "@/services/mappers";
import { BannerEditorDialog } from "./BannerEditorDialog";
import { ShopBanner } from "./banner";
import { collectionLinkedToShop, SHOP_TABS, type ShopTab } from "./types";
import { BrandedSwagTab } from "./tabs/BrandedSwagTab";
import { ShopCatalogTab } from "./tabs/ShopCatalogTab";
import { SentGiftsTab } from "./tabs/SentGiftsTab";
import { ReportsTab } from "./tabs/ReportsTab";

export function ShopDetailPage() {
  const { id } = useParams({ from: "/app/shops/$id" });
  const navigate = useNavigate();
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const [tab, setTab] = useState<ShopTab>("Branded Swag");
  const [editingLook, setEditingLook] = useState<UiShop | null>(null);

  const shop = workspace?.shops.find((s) => s.id === id) ?? null;
  const collections = useMemo(
    () =>
      shop ? (workspace?.collections ?? []).filter((c) => collectionLinkedToShop(c, shop.id)) : [],
    [workspace?.collections, shop],
  );

  if (isLoading && !workspace) {
    return <LoadingState message="Loading shop…" fullScreen={false} />;
  }
  if (isError || !workspace) {
    return (
      <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
        {error instanceof Error ? error.message : "Could not load shop"}
      </div>
    );
  }
  if (!shop) {
    return (
      <div className="card empty" style={{ padding: 48 }}>
        <h3>Shop not found</h3>
        <p>This shop may have been removed.</p>
        <Link to="/app/shops" className="btn btn-soft" style={{ marginTop: 14 }}>
          Back to shops
        </Link>
      </div>
    );
  }

  const sendPoints = () => {
    window.location.href = `/?view=shopDetail&shop=${encodeURIComponent(shop.id)}&launch=sendPoints`;
  };
  const startDesigning = () => {
    navigate({ to: "/app/swag/new", search: { shop: shop.id } });
  };

  return (
    <>
      <Link
        to="/app/shops"
        className="lnk"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14 }}
      >
        <ArrowLeft size={15} /> Back to shops
      </Link>

      <div className="row" style={{ alignItems: "center", gap: 16, marginBottom: 18 }}>
        <div style={{ width: 160, flex: "none" }}>
          <ShopBanner
            source={shop}
            height={84}
            layout="center"
            logoSize={46}
            radius={10}
            onEdit={() => setEditingLook(shop)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 26 }}>{shop.name}</h1>
          <div style={{ marginTop: 6 }}>
            {shop.live ? (
              <>
                <span className="tag tag-live">
                  <span className="dot" />
                  Live
                </span>
                <button
                  type="button"
                  className="lnk"
                  style={{
                    marginLeft: 8,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onClick={() => window.open(`/shop/${shop.id}`, "_blank", "noopener")}
                >
                  View shop
                </button>
              </>
            ) : (
              <span className="mut3" style={{ marginLeft: 8, fontSize: 13 }}>
                Publish to view shop
              </span>
            )}
          </div>
        </div>
        <button type="button" className="btn btn-dark" onClick={sendPoints}>
          <Coins size={16} /> Send points
        </button>
      </div>

      <div className="tabs" style={{ marginBottom: 22 }} role="tablist" aria-label="Shop sections">
        {SHOP_TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={t === tab}
            className={t === tab ? "on" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Branded Swag" && (
        <BrandedSwagTab shop={shop} collections={collections} onStartDesigning={startDesigning} />
      )}
      {tab === "Shop Catalog" && (
        <ShopCatalogTab shop={shop} products={workspace.catalogProducts} />
      )}
      {tab === "Sent Gifts" && <SentGiftsTab shop={shop} onSendPoints={sendPoints} />}
      {tab === "Reports" && <ReportsTab />}
      {(tab === "Layout" || tab === "Settings") && (
        <div className="card" style={{ padding: 26 }}>
          <h3 style={{ fontSize: 17, marginBottom: 8 }}>{tab}</h3>
          <p className="muted">
            Configure {tab.toLowerCase()} for {shop.name}. Banner, theme colours, custom domain and
            visibility live here.
          </p>
        </div>
      )}

      <BannerEditorDialog
        shop={editingLook}
        onOpenChange={(open) => !open && setEditingLook(null)}
      />
    </>
  );
}
