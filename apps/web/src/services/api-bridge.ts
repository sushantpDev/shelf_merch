/**
 * Thin bridge between the vanilla shelf-merch.js engine and TypeScript API services.
 */
import { ApiError, apiFetch, publicFetch } from "./api";
import {
  clearSession,
  getRefreshToken,
  getStoredUser,
  isAuthenticated,
  isPlatformUser,
  setSession,
  type AuthUser,
} from "./auth-store";
import { USE_MOCKS } from "./config";
import {
  createCollectionApi,
  createKitApi,
  launchPointsCampaignApi,
  linkCollectionToShopApi,
  syncOrgWizardApi,
} from "./mutations-api";
import type { UiCollection } from "./mappers";
import {
  createContactsApi,
  createShopApi,
  fetchWorkspaceSnapshot,
  publishShopApi,
  updateShopApi,
  type WorkspaceSnapshot,
} from "./workspace-api";
import type { UiProduct } from "./mappers";

export { ApiError, getStoredUser, isAuthenticated, isPlatformUser };
export type { AuthUser };

export function useMocks(): boolean {
  return USE_MOCKS;
}

type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: Parameters<typeof setSession>[0]["user"];
};

async function establishSession(result: AuthResult) {
  setSession(result);
  return result.user;
}

export async function login(email: string, password: string) {
  const result = await apiFetch<AuthResult>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password }),
  });
  return establishSession(result);
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  companyName: string;
}) {
  const result = await apiFetch<AuthResult>("/auth/register", {
    method: "POST",
    auth: false,
    body: JSON.stringify(payload),
  });
  return establishSession(result);
}

export async function logout() {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await apiFetch("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    }
  } finally {
    clearSession();
  }
}

export async function tryRestoreSession(): Promise<boolean> {
  if (!isAuthenticated()) return false;
  const me = getStoredUser();
  if (isPlatformUser(me)) return true;
  try {
    await fetchWorkspaceSnapshot(me);
    return true;
  } catch {
    clearSession();
    return false;
  }
}

export async function hydrateWorkspace(sessionUser?: AuthUser | null): Promise<WorkspaceSnapshot> {
  return fetchWorkspaceSnapshot(sessionUser);
}

export { fetchPlatformDashboard } from "./platform-api";

export function applyWorkspaceToState(S: Record<string, unknown>, data: WorkspaceSnapshot) {
  const prevOrg = (S.org ?? {}) as {
    step?: number;
    seq?: number;
    inWizard?: boolean;
    _c?: number;
  };
  S.account = data.account;
  S.user = {
    ...data.userPatch,
    email: data.userPatch.email,
    role: data.userPatch.role || "company_admin",
  };
  S.shops = data.shops;
  S.contacts = data.contacts;
  S.kits = data.kits;
  S.collections = data.collections;
  S.catalogProducts = data.catalogProducts;
  S.campaigns = data.campaigns;
  S.orders = data.orders;
  S.wallets = data.wallets;
  S.primaryEntityId = data.primaryEntityId;
  // Replace org data from API; keep only in-progress wizard navigation state.
  S.org = {
    step: prevOrg.step ?? 1,
    seq: prevOrg.seq ?? 6,
    _c: prevOrg._c,
    inWizard: prevOrg.inWizard ?? false,
    ...data.org,
  };
}

export async function createShopFlow(payload: {
  name: string;
  currency: string;
  categories: string[];
  logoUrl?: string;
  bannerConfig?: Record<string, unknown>;
}) {
  const currencyMode =
    payload.currency === "INR"
      ? "inr"
      : payload.currency === "Priceless"
        ? "priceless"
        : "points";
  const draft = await createShopApi({
    name: payload.name,
    currencyMode,
    categories: payload.categories,
    logoUrl: payload.logoUrl || "",
    bannerConfig: payload.bannerConfig || {},
  });
  return publishShopApi(draft.id);
}

export async function updateShopFlow(
  shopId: string,
  payload: { logoUrl?: string; bannerConfig?: Record<string, unknown> },
) {
  return updateShopApi(shopId, payload);
}

export async function addContactsFlow(emails: string[], role: string) {
  const entries = emails.map((email) => ({
    email,
    name: email.split("@")[0] || email,
    role,
  }));
  return createContactsApi(entries);
}

export async function createKitFlow(payload: {
  name: string;
  pickedIndices: number[];
  catalog: UiProduct[];
  packaging: string;
  designNotes?: string;
}) {
  return createKitApi({
    ...payload,
    packaging: payload.packaging === "box" ? "box" : "none",
  });
}

export async function createCollectionFlow(payload: {
  shopId: string;
  name: string;
  pickedIndices: number[];
  catalog: UiProduct[];
  preferredColors?: string[];
  artwork?: { file?: File; preview?: string; name?: string };
}) {
  return createCollectionApi(payload);
}

export async function linkCollectionToShopFlow(collectionId: string, shopId: string) {
  return linkCollectionToShopApi(collectionId, shopId);
}

export async function addProductToShopFlow(payload: {
  shopId: string;
  collection: UiCollection;
  product: UiProduct;
  catalog: UiProduct[];
}) {
  const catalogIndex = payload.product.id
    ? payload.catalog.findIndex((p) => p.id === payload.product.id)
    : payload.catalog.findIndex(
        (p) =>
          p.g === payload.product.g &&
          p.nm === payload.product.nm &&
          (p.brand || "") === (payload.product.brand || ""),
      );
  if (catalogIndex < 0) {
    throw new Error("Could not match this product to the catalog");
  }
  return createCollectionApi({
    shopId: payload.shopId,
    name: payload.collection.name,
    pickedIndices: [catalogIndex],
    catalog: payload.catalog,
    preferredColors: payload.collection.preferredColors || [],
  });
}

export async function launchPointsCampaignFlow(payload: {
  entityId: string;
  shopId: string;
  name: string;
  creditsPerRecipient: number;
  message: { from: string; body: string };
  contactIds: string[];
  contacts: Array<{ id: string; name: string; email: string; phone?: string }>;
}) {
  const recipients = payload.contactIds
    .map((id) => payload.contacts.find((c) => c.id === id))
    .filter(Boolean)
    .map((c) => ({ name: c!.name, email: c!.email, phone: c!.phone }));
  if (!recipients.length) throw new Error("Select at least one recipient");
  return launchPointsCampaignApi({
    entityId: payload.entityId,
    shopId: payload.shopId,
    name: payload.name,
    creditsPerRecipient: payload.creditsPerRecipient,
    message: payload.message,
    recipients,
  });
}

export async function syncOrgWizard(org: Parameters<typeof syncOrgWizardApi>[0]) {
  return syncOrgWizardApi(org);
}

export async function acceptInvite(token: string, password: string) {
  const result = await apiFetch<{ success: boolean; email: string }>("/users/accept-invite", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ token, password }),
  });
  try {
    return await login(result.email, password);
  } catch (err) {
    // Account was activated even if auto-login fails (e.g. stale session).
    if (err instanceof ApiError && err.code === "INVITE_PENDING") {
      throw err;
    }
    return { email: result.email, activated: true as const };
  }
}

// --- Public redemption API (no auth) ---

export async function getRedemptionPortal(token: string) {
  return publicFetch(`/redemptions/${token}`);
}

export async function sendRedemptionOtp(token: string, contact: string) {
  return publicFetch(`/redemptions/${token}/send-otp`, {
    method: "POST",
    body: JSON.stringify({ contact }),
  });
}

export async function verifyRedemptionOtp(token: string, code: string) {
  return publicFetch<{ sessionToken: string }>(`/redemptions/${token}/verify-otp`, {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function getRedemptionCatalog(token: string, sessionToken: string) {
  return publicFetch(`/redemptions/${token}/catalog`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
}

export async function submitRedemption(
  token: string,
  sessionToken: string,
  payload: unknown,
  idempotencyKey: string,
) {
  return publicFetch(`/redemptions/${token}/submit`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionToken}` },
    idempotencyKey,
    body: JSON.stringify(payload),
  });
}

export async function trackRedemption(token: string) {
  return publicFetch(`/redemptions/${token}/track`);
}
