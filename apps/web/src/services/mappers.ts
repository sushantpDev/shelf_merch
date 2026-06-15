import type { AuthUser } from "./auth-store";

export type UiPrintArea = {
  key?: string;
  label?: string;
  mockupImageUrl?: string;
  box: { xPct: number; yPct: number; widthPct: number; heightPct: number };
  maxWidthCm?: number;
  maxHeightCm?: number;
  dpi?: number;
  methods?: string[];
};

export type UiProduct = {
  id?: string;
  g: string;
  brand: string;
  nm: string;
  price: string;
  sw: number;
  colors?: string[];
  /** Resolved product photo URL (primaryImageUrl or first imageUrls entry). */
  imgUrl?: string;
  /** Super-admin design zones — artwork is clipped to the first matching area. */
  printAreas?: UiPrintArea[];
};

export type UiShop = {
  id: string;
  name: string;
  currency: string;
  live: boolean;
  categories: string[];
  collections: string[];
  logoUrl?: string;
  bannerConfig?: Record<string, unknown>;
  createdAt?: string;
  createdBy?: string;
};

export type UiContact = {
  id: string;
  email: string;
  name: string;
  role: string;
  address: string;
  loc: string;
};

export type UiKit = {
  id: string;
  name: string;
  items: number;
  status: string;
  sent: boolean;
};

export type UiCollection = {
  id: string;
  code: string;
  name: string;
  created: string;
  by: string;
  status: string;
  shopId: string;
  artworkUrl?: string;
  preferredColors?: string[];
  products: UiProduct[];
};

export type UiOrder = {
  id: string;
  date: string;
  name: string;
  orderNumber: string;
  status: string;
  rawStatus: string;
  amount: number;
  track: string;
  delivered: string;
  items: [string, string][];
};

export type UiCampaign = {
  id: string;
  name: string;
  status: string;
  type: string;
  recipientCount: number;
  totalBudget: number;
  creditsPerRecipient: number;
};

export type UiWallet = {
  id: string;
  name: string;
  cur: string;
  balance: number;
  unalloc: number;
  alloc: number;
  owner: string;
  email: string;
  activity: Array<{ t: string; who: string; amt: number; on: string }>;
};

export type UiOrgDept = {
  id: string | number;
  name: string;
  desc: string;
  users: number;
  allocated: number;
  spent: number;
  color: string;
  mgr: {
    name: string;
    email: string;
    mobile: string;
    role: string;
    invite: boolean;
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiProduct = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiEntity = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiUser = any;

function formatInr(n: number): string {
  if (n >= 1000) return `as low as ₹${Math.round(n).toLocaleString("en-IN")}`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function formatDate(d: string | Date | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function resolveMediaUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) return url;
  return `/${url.replace(/^\//, "")}`;
}

const GROUP_BY_CATEGORY: Record<string, string> = {
  Apparel: "tee",
  Drinkware: "bottle",
  Bags: "bag",
  Technology: "power",
  Office: "note",
  "Health & Wellness": "pillow",
};

export function mapCatalogProduct(p: ApiProduct): UiProduct {
  const variantColors = Array.isArray(p.variants)
    ? [...new Set(p.variants.map((v: { color?: string }) => v.color).filter(Boolean) as string[])]
    : [];
  const imgUrl = resolveMediaUrl(p.primaryImageUrl || p.imageUrls?.[0]);
  const printAreas = Array.isArray(p.printAreas)
    ? (p.printAreas as UiPrintArea[]).filter((a) => a?.box?.widthPct > 0 && a?.box?.heightPct > 0)
    : undefined;
  return {
    id: String(p._id),
    g: p.group || GROUP_BY_CATEGORY[p.category] || "tee",
    brand: p.brand || "",
    nm: p.name,
    price: formatInr(p.basePriceInr ?? 0),
    sw: Array.isArray(p.variants) ? Math.max(p.variants.length, 2) : 4,
    colors: variantColors,
    imgUrl,
    printAreas: printAreas?.length ? printAreas : undefined,
  };
}

export function mapProductRef(ref: ApiProduct, catalogById?: Map<string, UiProduct>): UiProduct {
  const id = ref.catalogProductId ? String(ref.catalogProductId) : undefined;
  const fromCatalog = id && catalogById?.get(id);
  const imgUrl = resolveMediaUrl(ref.imgUrl || ref.primaryImageUrl || ref.imageUrls?.[0] || fromCatalog?.imgUrl);
  return {
    id,
    g: ref.group || fromCatalog?.g || "tee",
    brand: ref.brand || fromCatalog?.brand || "",
    nm: ref.name,
    price: fromCatalog?.price || "",
    sw: fromCatalog?.sw ?? 4,
    imgUrl,
    printAreas: fromCatalog?.printAreas,
  };
}

export function mapShop(s: ApiProduct): UiShop {
  const currencyMap: Record<string, string> = {
    points: "Points",
    inr: "INR",
    priceless: "Priceless",
  };
  return {
    id: String(s._id),
    name: s.name,
    currency: currencyMap[s.currencyMode] || "Points",
    live: s.status === "live",
    categories: s.categories || [],
    collections: [],
    logoUrl: s.logoUrl || "",
    bannerConfig: s.bannerConfig || {},
    createdAt: s.createdAt ? String(s.createdAt) : undefined,
    createdBy: s.createdBy || "",
  };
}

export function mapContact(c: ApiProduct): UiContact {
  const addr = c.address || {};
  const loc = [addr.city, addr.state, addr.country === "IN" ? "IN" : addr.country]
    .filter(Boolean)
    .join(", ");
  return {
    id: String(c._id),
    email: c.email,
    name: c.name,
    role: c.role || "Member",
    address: addr.line1 || "",
    loc,
  };
}

export function mapKit(k: ApiProduct): UiKit {
  return {
    id: String(k._id),
    name: k.name,
    items: Array.isArray(k.productRefs) ? k.productRefs.length : 0,
    status: k.status === "live" ? "live" : "draft",
    sent: Boolean(k.lastSentAt),
  };
}

export function mapCollection(c: ApiProduct, createdByName = "", catalogById?: Map<string, UiProduct>): UiCollection {
  return {
    id: String(c._id),
    code: c.code || "",
    name: c.name,
    created: formatDate(c.createdAt),
    by: createdByName,
    status: c.status || "draft",
    shopId: String(c.shopId),
    artworkUrl: (c as { artworkUrl?: string }).artworkUrl || "",
    preferredColors: Array.isArray(c.preferredColors) ? c.preferredColors : [],
    products: (c.productRefs || []).map((ref: ApiProduct) => mapProductRef(ref, catalogById)),
  };
}

function mapOrderDisplayStatus(status: string): string {
  if (status === "delivered") return "Delivered";
  if (status === "shipped") return "Shipped";
  return "Processing";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapOrder(o: any, campaignName = ""): UiOrder {
  const deliveredEntry = (o.statusHistory || []).find((h: { status: string }) => h.status === "delivered");
  return {
    id: String(o._id),
    date: formatDate(o.createdAt),
    name: campaignName || o.orderNumber,
    orderNumber: o.orderNumber,
    status: mapOrderDisplayStatus(o.status),
    rawStatus: o.status,
    amount: o.amountBreakdown?.total ?? 0,
    track: o.trackingNumber || "",
    delivered: deliveredEntry ? formatDate(deliveredEntry.at) : "",
    items: (o.items || []).map((i: { name: string; qty: number }) => [i.name, String(i.qty)]),
  };
}

export function mapCampaign(c: ApiProduct): UiCampaign {
  return {
    id: String(c._id),
    name: c.name,
    status: c.status,
    type: c.type,
    recipientCount: c.recipientCount ?? 0,
    totalBudget: c.totalBudget ?? 0,
    creditsPerRecipient: c.creditsPerRecipient ?? 0,
  };
}

export function mapWallet(w: ApiProduct, owner?: ApiUser): UiWallet {
  const balance = w.balance ?? 0;
  const alloc = w.allocatedAmount ?? 0;
  return {
    id: String(w._id),
    name: w.name,
    cur: w.currency || "INR",
    balance,
    unalloc: w.unallocatedAmount ?? balance - alloc,
    alloc,
    owner: owner?.name || "—",
    email: owner?.email || "",
    activity: [],
  };
}

export function mapEntityToDept(e: ApiEntity, usersById: Map<string, ApiUser>): UiOrgDept {
  const mgr = e.managerUserId ? usersById.get(String(e.managerUserId)) : null;
  return {
    id: String(e._id),
    name: e.name,
    desc: e.description || "",
    users: e.expectedUsers ?? 0,
    allocated: e.allocatedAmount ?? 0,
    spent: e.spentAmount ?? 0,
    color: e.colorHex || "#2563EB",
    mgr: {
      name: mgr?.name || "",
      email: mgr?.email || "",
      mobile: mgr?.phone || "",
      role: mgr ? "Entity Manager" : "",
      invite: Boolean(e.managerInvitePending),
    },
  };
}

export function userInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

export function applyAuthUser(user: AuthUser, tenantName: string) {
  return {
    account: tenantName,
    user: { name: user.name, initials: userInitials(user.name), email: user.email },
  };
}
