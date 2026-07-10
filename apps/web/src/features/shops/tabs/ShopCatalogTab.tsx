import { useState } from "react";
import { Video } from "lucide-react";
import { toast } from "sonner";
import type { UiProduct, UiShop } from "@/services/mappers";
import { CatalogEditorDialog } from "../CatalogEditorDialog";
import { FeaturedPicksDialog } from "../FeaturedPicksDialog";
import shopCatalogImg from "../../../../assets/shop-catalog.png";

export function ShopCatalogTab({
  shop,
  products,
  canEditShop = true,
}: {
  shop: UiShop;
  products: UiProduct[];
  canEditShop?: boolean;
}) {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [featuredOpen, setFeaturedOpen] = useState(false);
  const total = products.length;
  const enabled = (shop.selectedCatalogProductIds || []).length;
  const featured = (shop.featuredCatalogProductIds || []).length;

  return (
    <>
      <div className="card shop-catalog-panel">
        <div className="shop-catalog-panel-grid">
          <div>
            <h3 className="shop-catalog-panel-title">Your Shop Catalog</h3>
            <p className="muted shop-catalog-panel-copy">
              Hide categories and items in your shop catalog so recipients only see what you want
              them to shop.
            </p>
            <p className="muted shop-catalog-panel-copy">
              <span className="shop-catalog-new">New</span>
              Customize the Featured Products section of your shop&apos;s landing page by picking
              your own products.
            </p>
            <div className="shop-catalog-panel-actions">
              {canEditShop ? (
                <>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setFeaturedOpen(true)}
                  >
                    Edit featured picks
                  </button>
                  <button type="button" className="btn btn-dark" onClick={() => setCatalogOpen(true)}>
                    Edit catalog
                  </button>
                </>
              ) : null}
              <button
                type="button"
                className="btn btn-ghost btn-sm shop-catalog-help"
                aria-label="Catalog help"
                onClick={() =>
                  toast.message("Shop Catalog", {
                    description:
                      "Edit Catalog controls what is visible in the shop. Edit Featured Picks controls the homepage highlights.",
                  })
                }
              >
                <Video size={16} />
              </button>
            </div>
            <p className="mut3 shop-catalog-panel-meta">
              {enabled} of {total} products visible
              {featured > 0 ? ` · ${featured} featured` : ""}
            </p>
          </div>
          <div className="shop-catalog-panel-art">
            <img src={shopCatalogImg} alt="" />
          </div>
        </div>
        {enabled === 0 ? (
          <div className="shop-catalog-panel-empty">
            <b>No products visible yet.</b> Use <b>Edit catalog</b> to enable items, then add designs
            in <b>Branded Swag</b> so they appear on the live shop.
          </div>
        ) : null}
      </div>

      <CatalogEditorDialog
        shop={shop}
        products={products}
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
      />
      <FeaturedPicksDialog
        shop={shop}
        products={products}
        open={featuredOpen}
        onOpenChange={setFeaturedOpen}
      />
    </>
  );
}
