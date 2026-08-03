/** Per-shop customer session (separate from tenant workspace auth). */

const KEY_PREFIX = "shelfmerch:shop-customer:";

export type ShopCustomer = {
  id: string;
  shopId: string;
  email: string;
  name: string;
  claimedViaRedeem?: boolean;
};

export type ShopCustomerSession = {
  accessToken: string;
  customer: ShopCustomer;
  creditAmount: number;
  redemptionToken: string | null;
};

function storageKey(shopId: string) {
  return `${KEY_PREFIX}${shopId}`;
}

export function getShopCustomerSession(shopId: string): ShopCustomerSession | null {
  if (typeof window === "undefined" || !shopId) return null;
  try {
    const raw = localStorage.getItem(storageKey(shopId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ShopCustomerSession;
    if (!parsed?.accessToken || !parsed?.customer?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setShopCustomerSession(shopId: string, session: ShopCustomerSession) {
  localStorage.setItem(storageKey(shopId), JSON.stringify(session));
}

export function clearShopCustomerSession(shopId: string) {
  localStorage.removeItem(storageKey(shopId));
}

export function getShopCustomerAccessToken(shopId: string): string | null {
  return getShopCustomerSession(shopId)?.accessToken ?? null;
}
