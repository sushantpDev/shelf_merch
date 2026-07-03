/** Client mirror of apps/api/src/middleware/tenantAccess.middleware.js */

const SUPER = "platform_super_admin";
const COMPANY_ADMIN = "company_admin";
const ENTITY_MANAGER = "entity_manager";

const BOTH = [COMPANY_ADMIN, ENTITY_MANAGER];

export type TenantArea =
  | "home"
  | "orders"
  | "wallets"
  | "shops"
  | "swag"
  | "kits"
  | "campaigns"
  | "campaignOps"
  | "contacts"
  | "settings"
  | "catalog"
  | "users";

const MATRIX: Record<TenantArea, { write: string[]; read: string[] }> = {
  home: { read: BOTH, write: [] },
  orders: { read: BOTH, write: [COMPANY_ADMIN] },
  wallets: { read: BOTH, write: [COMPANY_ADMIN] },
  shops: { read: BOTH, write: [COMPANY_ADMIN] },
  swag: { read: BOTH, write: [COMPANY_ADMIN] },
  kits: { read: BOTH, write: [COMPANY_ADMIN] },
  campaigns: { read: BOTH, write: BOTH },
  campaignOps: { read: BOTH, write: BOTH },
  contacts: { read: BOTH, write: BOTH },
  settings: { read: BOTH, write: [COMPANY_ADMIN] },
  catalog: { read: BOTH, write: [] },
  users: { read: [COMPANY_ADMIN], write: [COMPANY_ADMIN] },
};

export function rolesForTenantArea(
  area: TenantArea,
  action: "read" | "write" = "read",
): string[] {
  const entry = MATRIX[area];
  const roles = action === "write" ? entry.write : entry.read;
  return [...new Set([SUPER, ...roles])];
}

export function canAccessTenantArea(
  role: string | undefined,
  area: TenantArea,
  action: "read" | "write" = "read",
): boolean {
  if (!role) return false;
  return rolesForTenantArea(area, action).includes(role);
}

export type TenantNavItem = {
  area: TenantArea;
  key: string;
  label: string;
  href: string;
  match?: (pathname: string) => boolean;
};

export const TENANT_NAV: TenantNavItem[] = [
  {
    area: "home",
    key: "home",
    label: "Home",
    href: "/app",
    match: (pathname) => pathname === "/app" || pathname === "/app/",
  },
  { area: "orders", key: "orders", label: "Orders", href: "/app/orders" },
  { area: "wallets", key: "wallets", label: "Wallets", href: "/app/wallets" },
  { area: "shops", key: "shops", label: "Shops", href: "/app/shops" },
  { area: "swag", key: "swag", label: "Swag", href: "/app/swag" },
  { area: "kits", key: "kits", label: "Kits", href: "/app/kits" },
  { area: "campaigns", key: "campaigns", label: "Campaigns", href: "/app/campaigns" },
  { area: "contacts", key: "contacts", label: "Contacts", href: "/app/contacts" },
  { area: "settings", key: "settings", label: "Settings", href: "/app/settings" },
  { area: "catalog", key: "catalog", label: "Catalog", href: "/app/catalog" },
];

export function navItemsForTenantRole(role: string | undefined): TenantNavItem[] {
  return TENANT_NAV.filter((item) => canAccessTenantArea(role, item.area, "read"));
}
