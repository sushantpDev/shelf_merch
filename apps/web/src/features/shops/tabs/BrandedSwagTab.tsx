import { useState } from "react";
import { Link } from "react-router";
import { Plus, Shirt } from "lucide-react";
import { DesignedProductThumb } from "@/features/swag/DesignedProductThumb";
import type { UiCollection, UiShop } from "@/services/mappers";

const LOCKER_ITEMS: [string, number][] = [
  ["Mercer+Mettle Pack", 42],
  ["Bella + Canvas Hoodie", 88],
  ["Black Glossy Mug 11oz", 120],
  ["The Standard Bottle", 64],
];

type Sub = "Saved Designs" | "Locker Inventory" | "Archived";

export function BrandedSwagTab({
  shop,
  collections,
  onStartDesigning,
}: {
  shop: UiShop;
  collections: UiCollection[];
  onStartDesigning: () => void;
}) {
  const [sub, setSub] = useState<Sub>("Saved Designs");
  const active = collections.filter((c) => c.status !== "archived");
  const archived = collections.filter((c) => c.status === "archived");

  const subItems: [Sub, number | ""][] = [
    ["Saved Designs", active.length],
    ["Locker Inventory", ""],
    ["Archived", archived.length],
  ];

  return (
    <div style={{ display: "flex", gap: 22 }}>
      <div className="subrail">
        {subItems.map(([key, count]) => (
          <button
            key={key}
            type="button"
            className={`item ${sub === key ? "on" : ""}`}
            aria-current={sub === key}
            onClick={() => setSub(key)}
          >
            {key}
            {count !== "" && <span className="ct">{count}</span>}
          </button>
        ))}
      </div>

      <div className="shop-swag-content" style={{ flex: 1, minWidth: 0 }}>
        {sub === "Saved Designs" &&
          (active.length === 0 ? (
            <EmptyDesigner onStartDesigning={onStartDesigning} />
          ) : (
            <div className="card" style={{ padding: 22 }}>
              <div
                className="row"
                style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}
              >
                <h3 style={{ fontSize: 17 }}>Your branded swag designs</h3>
                <button type="button" className="btn btn-ghost btn-sm" onClick={onStartDesigning}>
                  <Plus size={15} /> Start designing
                </button>
              </div>
              <p className="muted" style={{ fontSize: 13, marginBottom: 18 }}>
                Add more logos to auto-generate additional collections for free.
              </p>
              <div className="grid shop-collection-grid">
                {active.map((col) => (
                  <CollectionCard key={col.id} shopId={shop.id} collection={col} />
                ))}
              </div>
            </div>
          ))}

        {sub === "Locker Inventory" && (
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 17, marginBottom: 14 }}>Locker inventory</h3>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>In locker</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {LOCKER_ITEMS.map(([name, qty]) => (
                  <tr key={name}>
                    <td style={{ fontWeight: 600 }}>{name}</td>
                    <td className="num">{qty}</td>
                    <td>
                      {qty < 50 ? (
                        <span className="tag tag-warn">
                          <span className="dot" />
                          Low
                        </span>
                      ) : (
                        <span className="tag tag-live">
                          <span className="dot" />
                          Healthy
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sub === "Archived" &&
          (archived.length === 0 ? (
            <div className="card empty">
              <div className="ic" aria-hidden="true">
                <Shirt size={34} color="#cdd6cf" />
              </div>
              <h3>No archived designs</h3>
              <p>Designs you archive will be stored here and can be restored any time.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 22 }}>
              <div className="grid shop-collection-grid">
                {archived.map((col) => (
                  <CollectionCard key={col.id} shopId={shop.id} collection={col} />
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  function EmptyDesigner({ onStartDesigning: onStart }: { onStartDesigning: () => void }) {
    return (
      <div className="card empty" style={{ padding: 48 }}>
        <div className="ic" aria-hidden="true">
          <Shirt size={34} color="#cdd6cf" />
        </div>
        <h3>Design branded swag for {shop.name}</h3>
        <p>Create branded collections your recipients can redeem.</p>
        <button
          type="button"
          className="btn btn-dark btn-lg"
          style={{ marginTop: 14 }}
          onClick={onStart}
        >
          <Plus size={16} /> Start designing
        </button>
      </div>
    );
  }
}

function CollectionCard({ shopId, collection }: { shopId: string; collection: UiCollection }) {
  const products = collection.products.slice(0, 4);
  const cols = products.length <= 1 ? 1 : 2;

  if (products.length === 0) {
    return (
      <article className="shop-collection-card">
        <div className="shop-collection-visual shop-collection-visual--empty" />
        <div className="shop-collection-meta">
          <div className="shop-collection-name">{collection.name}</div>
          <div className="shop-collection-sub muted">No products yet</div>
        </div>
      </article>
    );
  }

  if (products.length === 1) {
    const product = products[0];
    const label = product.brand ? `${product.brand} ${product.nm}` : product.nm;
    return (
      <Link
        to={`/app/shops/${shopId}/designs/${collection.id}?p=0`}
        className="shop-collection-card"
        aria-label={`View ${label}`}
      >
        <div
          className="shop-collection-visual"
          style={{ gridTemplateColumns: "repeat(1, minmax(0, 1fr))" }}
        >
          <div className="shop-collection-cell">
            <DesignedProductThumb product={product} artworkUrl={collection.artworkUrl} />
          </div>
        </div>
        <div className="shop-collection-meta">
          <div className="shop-collection-name">{collection.name}</div>
          <div className="shop-collection-sub muted">
            {collection.code} · {collection.products.length} item
          </div>
        </div>
      </Link>
    );
  }

  return (
    <article className="shop-collection-card shop-collection-card--multi">
      <div
        className="shop-collection-visual"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {products.map((p, i) => {
          const label = p.brand ? `${p.brand} ${p.nm}` : p.nm;
          return (
            <Link
              key={`${p.id ?? p.nm}-${i}`}
              to={`/app/shops/${shopId}/designs/${collection.id}?p=${i}`}
              className="shop-collection-cell"
              aria-label={`View ${label}`}
            >
              <DesignedProductThumb product={p} artworkUrl={collection.artworkUrl} />
            </Link>
          );
        })}
      </div>
      <div className="shop-collection-meta">
        <div className="shop-collection-name">{collection.name}</div>
        <div className="shop-collection-sub muted">
          {collection.code} · {collection.products.length} items
        </div>
      </div>
    </article>
  );
}
