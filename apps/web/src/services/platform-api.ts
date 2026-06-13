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
      available: number;
      reserved: number;
      lowStockThreshold: number;
      stockStatus: string;
    }>
  >(`/platform/inventory?limit=${limit}`);
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
