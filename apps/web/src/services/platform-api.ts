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

export type OrderItemProduct = {
  _id: string;
  name: string;
  baseImageUrl?: string;
  maskImageUrl?: string;
  primaryImageUrl?: string;
  imageUrls?: string[];
  printAreas?: PrintArea[];
  variants?: ProductVariant[];
  artworkUrl?: string;
};

export function fetchPlatformOrder(id: string) {
  return apiFetch<Record<string, unknown>>(`/platform/orders/${id}`);
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

export function approveFunding(walletId: string, amount: number) {
  return apiFetch(`/platform/finance/funding-approvals/${walletId}/approve`, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export function rejectFunding(walletId: string, reason: string) {
  return apiFetch(`/platform/finance/funding-approvals/${walletId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function fetchPlatformTeam() {
  return apiFetch<
    Array<{ userId: string; name: string; email: string; role: string; status: string }>
  >("/platform/team");
}

// ---- Tenant lifecycle controls ----
export const TENANT_STATUSES = ["active", "suspended", "trial", "archived"] as const;
export const TENANT_PLANS = ["trial", "starter", "growth", "enterprise"] as const;

export function setTenantStatus(id: string, status: string, reason?: string) {
  return apiFetch(`/platform/tenants/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, ...(reason ? { reason } : {}) }),
  });
}

export function setTenantPlan(id: string, plan: string) {
  return apiFetch(`/platform/tenants/${id}/plan`, {
    method: "PATCH",
    body: JSON.stringify({ plan }),
  });
}

// ---- Platform team management ----
export const PLATFORM_ROLES = [
  "platform_super_admin",
  "platform_ops_admin",
  "platform_catalog_admin",
  "platform_finance_admin",
  "platform_logistics_manager",
  "platform_production_manager",
  "platform_support_agent",
  "platform_readonly_auditor",
] as const;

export function inviteTeamMember(body: { name: string; email: string; role: string }) {
  return apiFetch("/platform/team", { method: "POST", body: JSON.stringify(body) });
}

export function changeTeamRole(userId: string, role: string) {
  return apiFetch(`/platform/team/${userId}`, { method: "PATCH", body: JSON.stringify({ role }) });
}

export function deactivateTeamMember(userId: string) {
  return apiFetch(`/platform/team/${userId}/deactivate`, { method: "POST" });
}

export function reactivateTeamMember(userId: string) {
  return apiFetch(`/platform/team/${userId}/reactivate`, { method: "POST" });
}

// ---- Settings ----
export function updateSetting(key: string, value: unknown) {
  return apiFetch(`/platform/settings/${key}`, { method: "PUT", body: JSON.stringify({ value }) });
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
  colorHex?: string;
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
  rotationDeg?: number;
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
  keyFeatures?: string;
  sizeGuide?: string;
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
  baseImageUrl?: string;
  maskImageUrl?: string;
  printAreas: PrintArea[];
  inventory?: { available?: number; mode?: string };
  source?: { provider?: string; domain?: string; externalId?: string; handle?: string };
};

export type ProductInput = {
  name: string;
  category: string;
  sellingPriceInr: number;
  costPriceInr?: number;
  brand?: string;
  description?: string;
  keyFeatures?: string;
  sizeGuide?: string;
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

/** Upload a production image. New products use role 'mask' for the transparent design PNG. */
export function uploadProductImage(id: string, file: File, role: "base" | "mask") {
  const form = new FormData();
  form.append("images", file);
  form.append("role", role);
  return apiFetch<{ baseImageUrl: string; maskImageUrl: string }>(
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
  updated: number;
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

// ---- Operations desk: status/action enums ----
export const ORDER_STATUSES = [
  "created", "approved", "mockup_pending", "mockup_approved", "in_production",
  "qc_pending", "packed", "shipped", "delivered", "issue_raised",
  "replacement_processing", "cancelled",
] as const;

export const SUPPORT_TICKET_STATUSES = [
  "open", "in_progress", "waiting_on_customer", "resolved", "closed",
] as const;

export const PRODUCTION_TASK_STATUSES = [
  "created", "material_pending", "mockup_pending", "mockup_approved", "in_production",
  "printing", "embroidery", "qc_pending", "packing", "ready_to_ship", "completed", "issue",
] as const;

export const SHIPMENT_STATUSES = [
  "pending", "packed", "shipped", "in_transit", "out_for_delivery",
  "delivered", "delayed", "rto", "lost", "damaged",
] as const;

// ---- Orders ----
export function fetchPlatformVendors(status = "active") {
  return apiFetch<Array<{ _id: string; name: string; type: string; status: string }>>(
    `/platform/vendors?status=${status}`,
  );
}
export function setOrderStatus(id: string, status: string, note?: string) {
  return apiFetch(`/platform/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, note: note ?? "" }) });
}
export function assignOrderVendor(id: string, vendorId: string) {
  return apiFetch(`/platform/orders/${id}/assign-vendor`, { method: "PATCH", body: JSON.stringify({ vendorId }) });
}
export function addOrderNote(id: string, body: string) {
  return apiFetch(`/platform/orders/${id}/notes`, { method: "POST", body: JSON.stringify({ body }) });
}
export function uploadOrderMockup(id: string, url: string) {
  return apiFetch(`/platform/orders/${id}/mockup`, { method: "POST", body: JSON.stringify({ url }) });
}
export function createOrderReplacement(id: string, reason: string) {
  return apiFetch(`/platform/orders/${id}/replacement`, { method: "POST", body: JSON.stringify({ reason }) });
}

// ---- Support tickets ----
export function setTicketStatus(id: string, status: string) {
  return apiFetch(`/platform/support-tickets/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}
export function assignTicket(id: string, userId: string) {
  return apiFetch(`/platform/support-tickets/${id}/assign`, { method: "PATCH", body: JSON.stringify({ userId }) });
}
export function addTicketMessage(id: string, body: string, internal = false) {
  return apiFetch(`/platform/support-tickets/${id}/messages`, { method: "POST", body: JSON.stringify({ body, internal }) });
}
export function resendRedemptionLink(id: string) {
  return apiFetch(`/platform/support-tickets/${id}/resend-redemption-link`, { method: "POST" });
}
export function resendTicketTracking(id: string) {
  return apiFetch(`/platform/support-tickets/${id}/resend-tracking-link`, { method: "POST" });
}

// ---- Production tasks ----
export function fetchProductionTasks(params?: { status?: string; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  q.set("limit", String(params?.limit ?? 100));
  return apiFetch<Paginated<Record<string, unknown>>>(`/platform/production/tasks?${q}`);
}
export function setTaskStatus(id: string, status: string, note?: string) {
  return apiFetch(`/platform/production/tasks/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, note: note ?? "" }) });
}
export function recordTaskQc(id: string, passed: boolean, reason?: string, photoUrl?: string) {
  return apiFetch(`/platform/production/tasks/${id}/qc`, { method: "POST", body: JSON.stringify({ passed, reason: reason ?? "", photoUrl: photoUrl ?? "" }) });
}
export function createProductionTask(orderId: string, assignedTo?: string) {
  return apiFetch("/platform/production/tasks", { method: "POST", body: JSON.stringify({ orderId, assignedTo: assignedTo ?? "" }) });
}

// ---- Shipments ----
export function createShipment(body: { orderId: string; courier: string; awb: string; trackingUrl?: string }) {
  return apiFetch("/platform/shipments", { method: "POST", body: JSON.stringify(body) });
}
export function addShipmentEvent(id: string, body: { status: string; location?: string; note?: string }) {
  return apiFetch(`/platform/shipments/${id}/events`, { method: "POST", body: JSON.stringify(body) });
}
export function updateShipment(id: string, body: { courier?: string; awb?: string; trackingUrl?: string }) {
  return apiFetch(`/platform/shipments/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}
export function resendShipmentTracking(id: string) {
  return apiFetch(`/platform/shipments/${id}/resend-tracking`, { method: "POST" });
}
