import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil, ZoomIn } from "lucide-react";
import type { UiCollection, UiProduct } from "@/services/mappers";
import { ProductInfoTabs } from "@/features/catalog/ProductInfoTabs";
import { productUniqueId } from "@/features/catalog/types";
import { catalogCategoryLabel } from "@/features/shops/types";
import {
  collectionProductColorNames,
  productColorHex,
  productDescription,
} from "./colors";
import { DesignedProductThumb } from "./DesignedProductThumb";

export type SwagDesignDetailProps = {
  collection: UiCollection;
  product: UiProduct;
  productIndex: number;
  shopId?: string;
  backLink: {
    to: "/app/shops/$id";
    params: { id: string };
    search?: { tab?: string };
    label?: string;
  };
};

/** Full-page branded design detail (shop or swag context). */
export function SwagDesignDetail({
  collection,
  product,
  productIndex,
  shopId,
  backLink,
}: SwagDesignDetailProps) {
  const [selColor, setSelColor] = useState(0);

  useEffect(() => {
    setSelColor(0);
  }, [collection.id, product.id, product.nm, productIndex]);

  const title = product.brand ? `${product.brand} ${product.nm}` : product.nm;
  const colorNames = collectionProductColorNames(collection, product);
  const uniqueId = collection.code || productUniqueId(product, productIndex);
  const category = product.category || catalogCategoryLabel(product);

  return (
    <div className="pd-page">
      <Link
        to={backLink.to}
        params={backLink.params}
        search={backLink.search}
        className="lnk"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20 }}
      >
        <ArrowLeft size={15} /> {backLink.label ?? "Back to shop"}
      </Link>

      <div className="pd-header">
        <div className="pd-title-wrap">
          <h1 className="pd-title">{title}</h1>
        </div>
        {shopId ? (
          <div className="pd-actions">
            <Link
              to="/app/swag/new"
              search={{ shop: shopId }}
              className="btn btn-ghost btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <Pencil size={14} /> Edit design
              <span className="tag tag-beta">Beta</span>
            </Link>
          </div>
        ) : null}
      </div>

      <div className="pd-body">
        <div className="pd-gallery">
          <div className="pd-img" style={{ background: "#f4f6f4" }}>
            <div className="pd-img-inner pd-img-mockup">
              <DesignedProductThumb product={product} artworkUrl={collection.artworkUrl} />
            </div>
            <button type="button" className="pd-zoom" aria-label="Zoom preview" tabIndex={-1}>
              <ZoomIn size={17} />
            </button>
          </div>
        </div>

        <div>
          <table className="pd-meta">
            <tbody>
              {colorNames.length > 0 && (
                <tr>
                  <th scope="row">Color</th>
                  <td>
                    <div className="pd-swatches">
                      {colorNames.map((name, i) => (
                        <button
                          key={name}
                          type="button"
                          title={name}
                          aria-label={name}
                          aria-pressed={selColor === i}
                          className={`pd-sw${selColor === i ? " on" : ""}`}
                          style={{ background: productColorHex(product, name) }}
                          onClick={() => setSelColor(i)}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              )}
              <tr>
                <th scope="row">Unique ID</th>
                <td>{uniqueId}</td>
              </tr>
              <tr>
                <th scope="row">Category</th>
                <td>{category}</td>
              </tr>
              <tr>
                <th scope="row">Notes</th>
                <td className="muted">{collection.name}</td>
              </tr>
            </tbody>
          </table>

          <ProductInfoTabs
            product={product}
            description={
              product.description?.trim() ? undefined : productDescription(product)
            }
          />
        </div>
      </div>
    </div>
  );
}
