import { Check, Info, Store } from "lucide-react";
import { DesignedProductThumb } from "../DesignedProductThumb";
import type { UiProduct, UiShop } from "@/services/mappers";

export function AddToShopStep({
  collectionName,
  products,
  artworkPreview,
  shops,
  picked,
  onToggle,
}: {
  collectionName: string;
  products: UiProduct[];
  artworkPreview?: string;
  shops: UiShop[];
  picked: Set<string>;
  onToggle: (shopId: string) => void;
}) {
  return (
    <div className="sw-art-studio">
      <div className="sw-art-layout">
        <header className="sw-art-page-head">
          <h1>Add to shop</h1>
          <p className="sw-art-page-lead">
            Choose the shops where <b>{collectionName}</b> should be published. All products in
            this collection will appear in each shop&apos;s Branded Swag and Shop Catalog.{" "}
            <span className="sw-art-page-info" title="Publishing info" aria-label="More information">
              <Info size={11} strokeWidth={2.5} />
            </span>
          </p>
        </header>

        {picked.size === 0 ? (
          <div className="sw-art-alert">
            <span>Select at least one shop, then click Publish to generate designs and publish.</span>
          </div>
        ) : (
          <div className="sw-art-alert" style={{ background: "var(--green-50)", borderColor: "var(--green-100)", color: "var(--green-800)" }}>
            <span>
              {picked.size} {picked.size === 1 ? "shop" : "shops"} selected — ready to publish.
            </span>
          </div>
        )}

        <aside className="sw-art-panel">
          <h2 className="sw-art-panel-title">Choose shops</h2>

          <div className="sw-art-prev-scroll sw-art-shop-scroll">
            <div className="sw-art-tab-body sw-art-prev-list">
              {shops.length === 0 ? (
                <div className="sw-art-prev-empty mut3">
                  Create a shop first, then publish this collection.
                </div>
              ) : (
                shops.map((shop) => {
                  const on = picked.has(shop.id);
                  return (
                    <button
                      key={shop.id}
                      type="button"
                      className={`sw-art-pick-row sw-art-shop-row${on ? " on" : ""}`}
                      onClick={() => onToggle(shop.id)}
                    >
                      <span className="sw-art-pick-main">
                        <span className="sw-art-shop-icon" aria-hidden="true">
                          <Store size={16} />
                        </span>
                        <span className="sw-art-pick-meta">
                          <span className="sw-art-pick-name">{shop.name}</span>
                          <span className="sw-art-pick-sub mut3">{shop.currency}</span>
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="sw-art-quality-tip">
            <Info size={14} />
            <span>
              Publishing adds every product in this collection to the selected shops. Each shop
              manages product visibility independently in Shop Catalog.
            </span>
          </div>
        </aside>

        <div className="sw-art-preview-stage">
          <div className="sw-art-preview-head">
            <div>
              <div className="sw-art-preview-title">Collection preview</div>
              <div className="mut3 sw-art-preview-hint">
                {products.length} {products.length === 1 ? "product" : "products"} in this collection
              </div>
            </div>
            {picked.size > 0 ? (
              <span className="sw-art-applied-badge">
                <Check size={13} strokeWidth={2.5} />
                {picked.size} {picked.size === 1 ? "shop" : "shops"} selected
              </span>
            ) : null}
          </div>

          <div className="sw-art-preview-scroll">
            <div className="sw-mockups">
              {products.map((p, i) => (
                <div key={`${p.id ?? p.nm}-${i}`} className="pcard mockup-card sw-mockup-card">
                  {artworkPreview ? (
                    <DesignedProductThumb product={p} artworkUrl={artworkPreview} />
                  ) : (
                    <DesignedProductThumb product={p} />
                  )}
                  <div className="meta">
                    {p.brand ? <div className="brand">{p.brand}</div> : null}
                    <div className="nm">{p.nm}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
