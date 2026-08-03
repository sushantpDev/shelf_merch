/** Vanity shop URLs — salesforce.store in prod, /shop/:id or /s/:slug locally. */

const SHOP_REDEEM_DOMAIN =
  (import.meta.env.VITE_SHOP_REDEEM_DOMAIN as string | undefined)?.toLowerCase() || "store";

export function slugifyShopName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "shop";
}

/** Extract shop slug when visiting e.g. salesforce.store */
export function shopSlugFromHostname(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") return null;
  const suffix = `.${SHOP_REDEEM_DOMAIN}`;
  if (!host.endsWith(suffix)) return null;
  const slug = host.slice(0, -suffix.length);
  if (!slug || slug.includes(".")) return null;
  return slug;
}

export function shopRedeemDisplayHost(slug: string): string {
  return `${slug}.${SHOP_REDEEM_DOMAIN}`;
}

export function shopRedeemPath(slug: string): string {
  return `/s/${slug}`;
}

/** Local/dev public storefront path by shop id. */
export function shopStorefrontPath(shopId: string): string {
  return `/shop/${shopId}`;
}

/** Shareable public storefront link (bookmarkable). */
export function shopStorefrontHref(shop: { id: string; slug?: string }): string {
  const slug = shop.slug?.trim();
  if (typeof window === "undefined") {
    return slug ? `https://${shopRedeemDisplayHost(slug)}` : shopStorefrontPath(shop.id);
  }
  if (
    import.meta.env.DEV ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return `${window.location.origin}${shopStorefrontPath(shop.id)}`;
  }
  if (slug) {
    const protocol = window.location.protocol === "http:" ? "http:" : "https:";
    return `${protocol}//${shopRedeemDisplayHost(slug)}`;
  }
  return `${window.location.origin}${shopStorefrontPath(shop.id)}`;
}

/** Shareable link (legacy redeem entry path — prefer storefront). */
export function shopRedeemHref(slug: string): string {
  if (typeof window === "undefined") {
    return `https://${shopRedeemDisplayHost(slug)}`;
  }
  if (import.meta.env.DEV) {
    return `${window.location.origin}${shopRedeemPath(slug)}`;
  }
  const protocol = window.location.protocol === "http:" ? "http:" : "https:";
  return `${protocol}//${shopRedeemDisplayHost(slug)}`;
}
