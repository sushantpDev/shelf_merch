import { apiFetch } from "./api";

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchPlatformDashboard() {
  return apiFetch<{
    cards: {
      activeTenants: number;
      totalGmvInr: number;
      ordersInProgress: number;
      delayedOrders: number;
      openSupportTickets: number;
      lowStockItems: number;
      outstandingPaymentsInr: number;
    };
    sections: Record<string, unknown>;
  }>("/platform/dashboard");
}

export async function fetchPlatformTenants(status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<
    Array<{
      _id: string;
      name: string;
      slug: string;
      status: string;
      plan?: string;
      walletBalanceInr: number;
      openOrders: number;
      outstandingInr: number;
    }>
  >(`/platform/tenants${q}`);
}

export async function fetchPlatformOrders(params?: { status?: string; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.limit) search.set("limit", String(params.limit));
  const q = search.toString();
  return apiFetch<Paginated<Record<string, unknown>>>(`/platform/orders${q ? `?${q}` : ""}`);
}

export async function fetchPlatformProducts(params?: { status?: string; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.limit) search.set("limit", String(params.limit ?? 100));
  return apiFetch<
    Paginated<{
      _id: string;
      name: string;
      sku: string;
      status: string;
      sellingPriceInr: number;
      costPriceInr: number;
      marginInr: number;
      marginPct: number;
      inventory?: { available?: number };
    }>
  >(`/platform/products${search.toString() ? `?${search}` : ""}`);
}

export async function fetchPlatformInventory(limit = 100) {
  return apiFetch<
    Paginated<{
      productId: string;
      name: string;
      sku: string;
      mode: string;
      available: number;
      reserved: number;
      lowStockThreshold: number;
      stockStatus: string;
    }>
  >(`/platform/inventory?limit=${limit}`);
}

export type InventoryTxnType = "add" | "reduce" | "adjust";

export function adjustInventory(
  productId: string,
  body: { type: InventoryTxnType; qty: number; reason: string; variantSku?: string },
) {
  return apiFetch(`/platform/inventory/${productId}/transactions`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function setInventoryMode(
  productId: string,
  body: { mode?: "physical" | "made_to_order"; lowStockThreshold?: number },
) {
  return apiFetch(`/platform/inventory/${productId}/mode`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function fetchPlatformKits() {
  return apiFetch<
    Array<{
      _id: string;
      name: string;
      status: string;
      approxValueInr: number;
      items?: unknown[];
    }>
  >("/platform/kits");
}

export type KitRules = {
  fixedComposition: boolean;
  customizationAllowed: boolean;
  minQtyPerRecipient: number;
  maxQtyPerRecipient: number;
};

export type KitItem = {
  _id?: string;
  catalogProductId: string;
  variantSku?: string;
  qty?: number;
};

export type PlatformKit = {
  _id: string;
  name: string;
  description?: string;
  packaging: string;
  eligibleCampaignTypes: string[];
  approxValueInr: number;
  imageUrls: string[];
  items: KitItem[];
  rules?: KitRules;
  status: string;
};

export type KitInput = {
  name: string;
  description?: string;
  packaging?: string;
  eligibleCampaignTypes?: string[];
  approxValueInr?: number;
  rules?: Partial<KitRules>;
};

export function getPlatformKit(id: string) {
  return apiFetch<PlatformKit>(`/platform/kits/${id}`);
}

export function createKit(body: KitInput) {
  return apiFetch<PlatformKit>("/platform/kits", { method: "POST", body: JSON.stringify(body) });
}

export function updateKit(id: string, body: Partial<KitInput>) {
  return apiFetch<PlatformKit>(`/platform/kits/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export function addKitItem(id: string, item: KitItem) {
  return apiFetch<KitItem[]>(`/platform/kits/${id}/items`, { method: "POST", body: JSON.stringify(item) });
}

export function removeKitItem(id: string, itemId: string) {
  return apiFetch<KitItem[]>(`/platform/kits/${id}/items/${itemId}`, { method: "DELETE" });
}

export function uploadKitImages(id: string, files: File[]) {
  const form = new FormData();
  for (const file of files) form.append("images", file);
  return apiFetch<{ imageUrls: string[] }>(`/platform/kits/${id}/images`, { method: "POST", body: form });
}

export function publishKit(id: string) {
  return apiFetch<PlatformKit>(`/platform/kits/${id}/publish`, { method: "POST" });
}

export async function fetchPlatformShipments(limit = 50) {
  return apiFetch<Paginated<Record<string, unknown>>>(`/platform/shipments?limit=${limit}`);
}

export async function fetchPlatformSupport(limit = 50) {
  return apiFetch<Paginated<Record<string, unknown>>>(`/platform/support-tickets?limit=${limit}`);
}

export async function fetchProductionBoard() {
  return apiFetch<{
    taskBuckets: Record<string, { count: number; tasks: unknown[] }>;
    orderBuckets: Record<string, { count: number; orders: unknown[] }>;
    totalTasks: number;
    totalOrders: number;
  }>("/platform/production");
}

export async function fetchFinanceOutstanding() {
  return apiFetch<
    Array<{
      tenantId: string;
      tenantName: string;
      tenantStatus: string;
      walletBalanceInr: number;
      outstandingInr: number;
      unpaidInvoices: number;
    }>
  >("/platform/finance/outstanding");
}

export async function fetchFundingApprovals() {
  return apiFetch<unknown[]>("/platform/finance/funding-approvals");
}

export async function fetchPlatformTeam() {
  return apiFetch<
    Array<{ userId: string; name: string; email: string; role: string; status: string }>
  >("/platform/team");
}

export async function fetchPlatformSettings() {
  return apiFetch<Record<string, unknown>>("/platform/settings");
}

export async function fetchAuditLogs(limit = 50) {
  return apiFetch<Paginated<Record<string, unknown>>>(`/platform/audit-logs?limit=${limit}`);
}

// ---- Catalog product management (platform_catalog_admin / super admin) ----

export type ProductVariant = {
  _id?: string;
  size?: string;
  color?: string;
  material?: string;
  sku: string;
  priceOverrideInr?: number | null;
  stock?: number;
};

export type PrintAreaBox = { xPct: number; yPct: number; widthPct: number; heightPct: number };

export type PrintArea = {
  key?: string;
  label: string;
  mockupImageUrl?: string;
  box: PrintAreaBox;
  maxWidthCm?: number;
  maxHeightCm?: number;
  dpi?: number;
  methods?: string[];
};

export type PlatformProduct = {
  _id: string;
  name: string;
  sku: string;
  slug?: string;
  category: string;
  brand?: string;
  description?: string;
  status: string;
  sellingPriceInr: number;
  costPriceInr: number;
  marginPct?: number;
  gstRate?: number;
  hsnCode?: string;
  moq?: number;
  material?: string;
  productionDays?: number;
  variants: ProductVariant[];
  imageUrls: string[];
  primaryImageUrl?: string;
  printAreas: PrintArea[];
  inventory?: { available?: number; mode?: string };
};

export type ProductInput = {
  name: string;
  category: string;
  sellingPriceInr: number;
  costPriceInr?: number;
  brand?: string;
  description?: string;
  skuPrefix?: string;
  gstRate?: number;
  hsnCode?: string;
  moq?: number;
  material?: string;
  productionDays?: number;
  reason?: string;
};

export function getPlatformProduct(id: string) {
  return apiFetch<PlatformProduct>(`/platform/products/${id}`);
}

export function createProduct(body: ProductInput) {
  return apiFetch<PlatformProduct>("/platform/products", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateProduct(id: string, body: Partial<ProductInput>) {
  return apiFetch<PlatformProduct>(`/platform/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function addVariant(id: string, variant: ProductVariant) {
  return apiFetch<ProductVariant[]>(`/platform/products/${id}/variants`, {
    method: "POST",
    body: JSON.stringify(variant),
  });
}

export function updateVariant(id: string, variantId: string, patch: Partial<ProductVariant>) {
  return apiFetch<ProductVariant[]>(`/platform/products/${id}/variants/${variantId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function uploadProductImages(id: string, files: File[], primary = false) {
  const form = new FormData();
  for (const file of files) form.append("images", file);
  if (primary) form.append("primary", "true");
  return apiFetch<{ imageUrls: string[]; primaryImageUrl: string }>(
    `/platform/products/${id}/images`,
    { method: "POST", body: form },
  );
}

export function setPrintAreas(id: string, printAreas: PrintArea[]) {
  return apiFetch<PrintArea[]>(`/platform/products/${id}/print-areas`, {
    method: "PUT",
    body: JSON.stringify({ printAreas }),
  });
}

export function publishProduct(id: string) {
  return apiFetch<PlatformProduct>(`/platform/products/${id}/publish`, { method: "POST" });
}

export function unpublishProduct(id: string) {
  return apiFetch<PlatformProduct>(`/platform/products/${id}/unpublish`, { method: "POST" });
}

export function archiveProduct(id: string) {
  return apiFetch<PlatformProduct>(`/platform/products/${id}/archive`, { method: "POST" });
}

export function listCategories() {
  return apiFetch<{ _id: string; name: string }[]>("/platform/categories");
}

export type ShopifyImportSummary = {
  domain: string;
  total: number;
  imported: number;
  skipped: number;
  failed: number;
  items: { title: string; status: string; reason?: string }[];
};

export function importShopify(domain: string, accessToken: string) {
  return apiFetch<ShopifyImportSummary>("/platform/products/import/shopify", {
    method: "POST",
    body: JSON.stringify({ domain, accessToken }),
  });
}
