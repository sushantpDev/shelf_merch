import { useState } from "react";
import type { UiProduct, UiShop } from "@/services/mappers";
import { CatalogEditorDialog } from "../CatalogEditorDialog";

export function ShopCatalogTab({ shop, products }: { shop: UiShop; products: UiProduct[] }) {
  const [open, setOpen] = useState(false);
  const total = products.length;
  const count = (shop.selectedCatalogProductIds || []).length;

  return (
    <>
      <div className="card" style={{ padding: 28 }}>
        <h3 style={{ fontSize: 20, marginBottom: 10 }}>Your Shop Catalog</h3>
        <p className="muted" style={{ lineHeight: 1.65, marginBottom: 8, maxWidth: "60ch" }}>
          Choose which catalog products appear in your live shop. Only selected items are visible to
          recipients.
        </p>
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.55, maxWidth: "60ch" }}>
          Create branded designs in <b>Branded Swag</b> after enabling products here.
        </p>
        <div
          className="row"
          style={{ gap: 10, marginTop: 18, alignItems: "center", flexWrap: "wrap" }}
        >
          <button type="button" className="btn btn-dark" onClick={() => setOpen(true)}>
            Edit catalog
          </button>
          <span className="mut3" style={{ fontSize: 13 }}>
            {count} of {total} products enabled
          </span>
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
              <b>No products enabled.</b> Your live shop will show the banner only until you select
              catalog items in <b>Edit catalog</b>.
            </div>
          </div>
        )}
      </div>

      <CatalogEditorDialog shop={shop} products={products} open={open} onOpenChange={setOpen} />
    </>
  );
}
