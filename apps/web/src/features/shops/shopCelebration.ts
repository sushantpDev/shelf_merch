const KEY = "sm:shop-just-created";

export type ShopCelebration = {
  shopId: string;
  shopName: string;
};

/** Persist celebration across the create → shop-detail navigation. */
export function markShopCelebration(payload: ShopCelebration) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* private mode / blocked storage */
  }
}

export function peekShopCelebration(shopId?: string): ShopCelebration | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ShopCelebration;
    if (!parsed?.shopId || !parsed?.shopName) return null;
    if (shopId && parsed.shopId !== shopId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearShopCelebration() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
