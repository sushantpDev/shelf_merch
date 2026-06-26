import type { UiCollection, UiProduct, UiShop } from "@/services/mappers";

export const SHOP_TABS = [
  "Branded Swag",
  "Shop Catalog",
  "Sent Gifts",
  "Layout",
  "Settings",
  "Reports",
] as const;
export type ShopTab = (typeof SHOP_TABS)[number];

export const SHOP_CURRENCIES = [
  { key: "Points", title: "Points", desc: "₹2 = 1 Pt. Recipients redeem with points." },
  { key: "INR", title: "Indian Rupee (₹)", desc: "Prices shown in rupees, GST inclusive." },
  {
    key: "Priceless",
    title: "Priceless",
    desc: "Hide prices. Choose how many items recipients can redeem.",
  },
] as const;

export const BUILDER_CATEGORIES: [string, string][] = [
  ["Food & Beverages", "mug"],
  ["Work Essentials", "note"],
  ["Merch", "tee"],
  ["Life & Hobbies", "cap"],
  ["Wellness", "bottle"],
  ["Experiences", "spark"],
  ["Luxury", "bag"],
];

export const DEFAULT_BUILDER_CATEGORIES = ["Food & Beverages", "Work Essentials", "Merch"];

/** "Created: 06/26/2026 | Jane Doe | Points" meta line for a shop card. */
export function shopCardMeta(shop: UiShop, fallbackUser: string): string {
  const date = shop.createdAt ? new Date(shop.createdAt) : new Date();
  const created = date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
  return `Created: ${created}  |  ${shop.createdBy || fallbackUser}  |  ${shop.currency}`;
}

export function collectionLinkedToShop(col: UiCollection, shopId: string): boolean {
  if (!col || !shopId) return false;
  const sid = String(shopId);
  const linked = (col.shopIds || []).map(String);
  if (linked.length) return linked.includes(sid);
  return col.shopId === sid;
}

const CATEGORY_BY_GROUP: Record<string, string> = {
  tee: "Apparel",
  hoodie: "Apparel",
  mug: "Drinkware",
  bottle: "Drinkware",
  pack: "Merch",
  cap: "Merch",
  note: "Work Essentials",
  power: "Work Essentials",
  bag: "Merch",
  pillow: "Wellness",
};

export function catalogCategoryLabel(p: UiProduct): string {
  return p.category || CATEGORY_BY_GROUP[p.g] || "Merch";
}

/** Stable selection key for a catalog product (id, or index fallback). */
export function catalogProductKey(p: UiProduct, index: number): string {
  return p.id || `demo:${index}`;
}
