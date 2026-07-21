import type { UiShop } from "@/services/mappers";
import { CatalogEditor } from "../CatalogEditor";
import { publishedShopListings, type ShopListing } from "../shopListings";

export function ShopCatalogTab({
  shop,
  listings,
  canEditShop = true,
}: {
  shop: UiShop;
  listings: ShopListing[];
  canEditShop?: boolean;
}) {
  return (
    <>
      {/* Temporarily hidden — featured picks default to 5 most recently added on the storefront.
      <div className="card shop-catalog-panel">
        <div className="shop-catalog-panel-grid">
          <div>
            <h3 className="shop-catalog-panel-title">Your Shop Catalog</h3>
            <p className="muted shop-catalog-panel-copy">
              Control which products from your published collections appear on the live storefront.
            </p>
            <p className="muted shop-catalog-panel-copy">
              <span className="shop-catalog-new">New</span>
              Customize the Featured Products section of your shop&apos;s landing page by picking
              your own products.
            </p>
            <div className="shop-catalog-panel-actions">
              {canEditShop ? (
                <>
                  <button type="button" className="btn btn-ghost">
                    Edit featured picks
                  </button>
                </>
              ) : null}
              <button type="button" className="btn btn-ghost btn-sm shop-catalog-help" aria-label="Catalog help">
                Video
              </button>
            </div>
            <p className="mut3 shop-catalog-panel-meta">…</p>
          </div>
          <div className="shop-catalog-panel-art">
            <img src="" alt="" />
          </div>
        </div>
      </div>
      */}

      {canEditShop ? <CatalogEditor shop={shop} listings={listings} /> : null}
    </>
  );
}

/** Build listings for shop catalog from published collections. */
export function shopCatalogListings(
  collections: Parameters<typeof publishedShopListings>[0],
  catalogProducts: Parameters<typeof publishedShopListings>[1],
) {
  return publishedShopListings(collections, catalogProducts);
}
