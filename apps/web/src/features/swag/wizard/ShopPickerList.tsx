import type { UiShop } from "@/services/mappers";

export function ShopPickerList({
  shops,
  picked,
  onToggle,
}: {
  shops: UiShop[];
  picked: Set<string>;
  onToggle: (shopId: string) => void;
}) {
  if (shops.length === 0) {
    return (
      <p className="muted" style={{ fontSize: 14 }}>
        Create a shop first, then publish this collection.
      </p>
    );
  }

  return (
    <div className="swag-publish-shop-list">
      {shops.map((shop) => {
        const on = picked.has(shop.id);
        return (
          <label key={shop.id} className={`swag-publish-shop-row${on ? " on" : ""}`}>
            <input type="checkbox" checked={on} onChange={() => onToggle(shop.id)} />
            <span className="swag-publish-shop-name">{shop.name}</span>
            <span className="mut3">{shop.currency}</span>
          </label>
        );
      })}
    </div>
  );
}
