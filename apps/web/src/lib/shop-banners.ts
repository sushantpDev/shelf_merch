export type ShopBannerPreset = {

  id: string;

  label: string;

};



/** Preset image banners shop owners can pick for their storefront (2560×853 px, 3:1). */

export const SHOP_BANNER_PRESETS: ShopBannerPreset[] = [

  { id: "dia-de-los-muertos", label: "Feliz Dia de los Muertos" },

  { id: "happy-passover", label: "Happy Passover" },

  { id: "thats-a-wrap", label: "That's a Wrap!" },

  { id: "out-of-this-world", label: "Out of This World" },

  { id: "happy-summer", label: "Happy Summer" },

  { id: "snack-break", label: "Snack Break" },

  { id: "pizza-party", label: "Pizza Party" },

  { id: "happy-pride", label: "Happy Pride" },

  { id: "mothers-day", label: "Mother's Day" },

  { id: "handcrafted-haven", label: "Handcrafted Haven" },

  { id: "exceptional-leader", label: "Exceptional Leader" },

  { id: "stellar-performance", label: "Stellar Performance" },

  { id: "standing-ovation", label: "Standing Ovation" },

  { id: "surprise", label: "Surprise!" },

  { id: "welcome", label: "Welcome" },

  { id: "happy-birthday", label: "Happy Birthday" },

  { id: "happy-holi", label: "Happy Holi" },

  { id: "merry-christmas", label: "Merry Christmas" },

  { id: "we-did-it", label: "We Did It!" },

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



/** Image URL for a shop's preset banner (2560×853 / 3:1 in `/public/shop-banners/`). */

export function shopHeroBannerUrl(shop: { bannerPreset?: string }) {

  return shopBannerPresetUrl(shop.bannerPreset);

}


