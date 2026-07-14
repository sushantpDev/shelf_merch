import { DEFAULT_BUILDER_CATEGORIES } from "./types";

export type ShopDraft = {
  step: 0 | 1 | 2;
  name: string;
  currency: string;
  logoUrl: string;
  categories: string[];
  bannerTheme: string;
  bannerPreset: string;
  bannerImageUrl: string;
};

export const INITIAL_SHOP_DRAFT: ShopDraft = {
  step: 0,
  name: "",
  currency: "Points",
  logoUrl: "",
  categories: DEFAULT_BUILDER_CATEGORIES,
  bannerTheme: "dark",
  bannerPreset: "solid-pattern",
  bannerImageUrl: "",
};

export type ShopDraftAction =
  | { type: "set"; patch: Partial<ShopDraft> }
  | { type: "toggleCategory"; category: string };

export function shopDraftReducer(state: ShopDraft, action: ShopDraftAction): ShopDraft {
  if (action.type === "toggleCategory") {
    const has = state.categories.includes(action.category);
    return {
      ...state,
      categories: has
        ? state.categories.filter((c) => c !== action.category)
        : [...state.categories, action.category],
    };
  }
  return { ...state, ...action.patch };
}
