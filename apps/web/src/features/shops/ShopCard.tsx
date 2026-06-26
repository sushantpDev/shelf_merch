import { Link } from "@tanstack/react-router";
import type { UiShop } from "@/services/mappers";
import { ShopBanner } from "./banner";
import { shopCardMeta } from "./types";

export function ShopCard({
  shop,
  fallbackUser,
  onEditLook,
}: {
  shop: UiShop;
  fallbackUser: string;
  onEditLook: (shop: UiShop) => void;
}) {
  return (
    <div className="card shop-card">
      <Link
        to="/app/shops/$id"
        params={{ id: shop.id }}
        aria-label={`Open ${shop.name}`}
        style={{ display: "block", color: "inherit", textDecoration: "none" }}
      >
        <ShopBanner
          source={shop}
          height={132}
          layout="center"
          logoSize={52}
          onEdit={() => onEditLook(shop)}
        />
      </Link>
      <div className="shop-card-body">
        <div
          className="row"
          style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}
        >
          <h3 style={{ fontSize: 17 }}>{shop.name}</h3>
          {shop.live ? (
            <span className="tag tag-live tag-live-outline">
              <span className="dot" />
              Live
            </span>
          ) : (
            <span className="tag tag-draft">Draft</span>
          )}
        </div>
        <div className="shop-card-meta">{shopCardMeta(shop, fallbackUser)}</div>
        <div style={{ marginTop: 14, textAlign: "right" }}>
          <Link to="/app/shops/$id" params={{ id: shop.id }} className="btn btn-soft btn-sm">
            Open
          </Link>
        </div>
      </div>
    </div>
  );
}
