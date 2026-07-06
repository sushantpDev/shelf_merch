import { useState } from "react";
import type { UiProduct, UiShop } from "@/services/mappers";
import { CatalogEditorDialog } from "../CatalogEditorDialog";
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
  const [open, setOpen] = useState(false);
  const total = products.length;
  const count = (shop.selectedCatalogProductIds || []).length;

  return (
    <>
      <div className="card" style={{ padding: 28 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(240px,340px)",
            gap: 28,
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ fontSize: 20, marginBottom: 10 }}>Your Shop Catalog</h3>
            <p className="muted" style={{ lineHeight: 1.65, marginBottom: 8 }}>
              Mark the catalog products you plan to design for this shop. Products only appear on
              your live storefront after you create a design for them in <b>Branded Swag</b>.
            </p>
            <div
              className="row"
              style={{ gap: 10, marginTop: 18, alignItems: "center", flexWrap: "wrap" }}
            >
              {canEditShop ? (
                <button type="button" className="btn btn-dark" onClick={() => setOpen(true)}>
                  Edit catalog
                </button>
              ) : null}
              <span className="mut3" style={{ fontSize: 13 }}>
                {count} of {total} products enabled
              </span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
            <img
              src={shopCatalogImg}
              alt="Shop catalog product selection"
              style={{
                maxWidth: "100%",
                width: "min(320px,100%)",
                height: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
        </div>
        {count === 0 && (
          <div
            className="banner"
            style={{
              marginTop: 18,
              borderColor: "#f3c4cb",
              background: "#fff5f6",
              color: "#9b1c1c",
            }}
          >
            <div>
              <b>No products marked yet.</b> Add designs in <b>Branded Swag</b> to make products
              visible on your storefront.
            </div>
          </div>
        )}
      </div>

      <CatalogEditorDialog shop={shop} products={products} open={open} onOpenChange={setOpen} />
    </>
  );
}
