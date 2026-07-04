import { Link } from "react-router";
import { ArrowLeft, Coins } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { ShopBanner } from "../banner";
import { SHOP_TABS } from "../types";
import { BrandedSwagTab } from "../tabs/BrandedSwagTab";
import { ShopCatalogTab } from "../tabs/ShopCatalogTab";
import { SentGiftsTab } from "../tabs/SentGiftsTab";
import { ShopLayoutTab } from "../tabs/ShopLayoutTab";
import { ReportsTab } from "../tabs/ReportsTab";
import type { ShopDetailVm } from "../controllers/useShopDetailController";

/** Shop detail page: banner header, tab bar, and the active tab's content. */
export function ShopDetailView(vm: ShopDetailVm) {
  if (vm.isLoading) {
    return <LoadingState message="Loading shop…" fullScreen={false} />;
  }
  if (vm.errorMessage) {
    return (
      <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
        {vm.errorMessage}
      </div>
    );
  }

  const { shop } = vm;
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
          <ShopBanner source={shop} height={84} layout="center" logoSize={46} radius={10} />
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
                  onClick={vm.onViewLiveShop}
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
        <button type="button" className="btn btn-brand" onClick={vm.onSendPoints}>
          <Coins size={16} /> Send points
        </button>
      </div>

      <div className="tabs" style={{ marginBottom: 22 }} role="tablist" aria-label="Shop sections">
        {SHOP_TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={t === vm.tab}
            className={t === vm.tab ? "on" : ""}
            onClick={() => vm.onSelectTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {vm.tab === "Branded Swag" && (
        <BrandedSwagTab
          shop={shop}
          collections={vm.collections}
          onStartDesigning={vm.onStartDesigning}
        />
      )}
      {vm.tab === "Shop Catalog" && <ShopCatalogTab shop={shop} products={vm.catalogProducts} />}
      {vm.tab === "Sent Gifts" && <SentGiftsTab shop={shop} onSendPoints={vm.onSendPoints} />}
      {vm.tab === "Layout" && <ShopLayoutTab shop={shop} />}
      {vm.tab === "Reports" && <ReportsTab />}
      {vm.tab === "Settings" && (
        <div className="card" style={{ padding: 26 }}>
          <h3 style={{ fontSize: 17, marginBottom: 8 }}>Settings</h3>
          <p className="muted">
            Configure settings for {shop.name}. Custom domain and visibility options live here.
          </p>
        </div>
      )}
    </>
  );
}
