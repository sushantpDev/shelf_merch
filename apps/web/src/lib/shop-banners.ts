export type ShopBannerPreset = {
  id: string;
  label: string;
};

/** Preset image banners shop owners can pick for their storefront. */
export const SHOP_BANNER_PRESETS: ShopBannerPreset[] = [
  { id: "out-of-this-world", label: "Out of This World" },
  { id: "healthcare-heroes", label: "Healthcare Heroes" },
  { id: "happy-summer", label: "Happy Summer" },
  { id: "stellar-performance", label: "Stellar Performance" },
  { id: "snack-break", label: "Snack Break" },
  { id: "happy-pride", label: "Happy Pride" },
  { id: "welcome-team", label: "Welcome to the Team" },
  { id: "mothers-day", label: "Mother's Day" },
  { id: "wellness-shop", label: "Wellness Shop" },
  { id: "exceptional-leader", label: "Exceptional Leader" },
  { id: "welcome", label: "Welcome" },
  { id: "work-from-anywhere", label: "Work From Anywhere" },
  { id: "earth-day", label: "Earth Day" },
  { id: "happy-birthday", label: "Happy Birthday" },
  { id: "merry-christmas", label: "Merry Christmas" },
  { id: "one-team", label: "We Are One Team" },
  { id: "admin-professionals-day", label: "Admin Professionals Day" },
  { id: "women-owned-businesses", label: "Women-Owned Businesses" },
  { id: "fathers-day", label: "Father's Day" },
  { id: "team-spirit", label: "Team Spirit" },
  { id: "celebrate", label: "Celebrate" },
  { id: "gratitude", label: "Gratitude" },
  { id: "you-rock", label: "You Rock" },
  { id: "holiday-cheer", label: "Holiday Cheer" },
  { id: "festive-season", label: "Festive Season" },
  { id: "spring-forward", label: "Spring Forward" },
  { id: "autumn-vibes", label: "Autumn Vibes" },
  { id: "winter-wonder", label: "Winter Wonder" },
  { id: "shine-bright", label: "Shine Bright" },
  { id: "dream-big", label: "Dream Big" },
  { id: "make-it-happen", label: "Make It Happen" },
  { id: "together-we-rise", label: "Together We Rise" },
  { id: "innovation", label: "Innovation" },
  { id: "milestone", label: "Milestone" },
  { id: "shelfmerch-holiday", label: "ShelfMerch Holiday" },
];

const presetIds = new Set(SHOP_BANNER_PRESETS.map((p) => p.id));

export function shopBannerPresetUrl(id?: string) {
  if (!id || !presetIds.has(id)) return "";
  return `/shop-banners/${id}.png`;
}

export function shopBannerPresetLabel(id?: string) {
  if (!id) return "";
  return SHOP_BANNER_PRESETS.find((p) => p.id === id)?.label || "";
}
