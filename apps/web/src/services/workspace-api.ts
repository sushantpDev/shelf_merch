import { apiFetch } from "./api";
import type { WalletUploadFile } from "@/features/wallets/types";
import {
  applyAuthUser,
  mapCampaign,
  mapCatalogProduct,
  mapCollection,
  mapContact,
  mapEntityToDept,
  mapKit,
  mapOrder,
  mapShop,
  mapWallet,
  type UiCampaign,
  type UiOrder,
  type UiCollection,
  type UiContact,
  type UiKit,
  type UiProduct,
  type UiShop,
  type UiWallet,
} from "./mappers";
import { getStoredUser, type AuthUser } from "./auth-store";

export type WalletOrgView = {
  active: boolean;
  wallet: WorkspaceSnapshot["org"]["wallet"];
  departments: WorkspaceSnapshot["org"]["departments"];
};

export type WorkspaceOwner = { id: string; name: string; email: string };

export type WorkspaceSnapshot = {
  account: string;
  logoUrl: string;
  userPatch: { name: string; initials: string; email: string; role: string };
  owner?: WorkspaceOwner;
  shops: UiShop[];
  contacts: UiContact[];
  kits: UiKit[];
  collections: UiCollection[];
  catalogProducts: UiProduct[];
  catalogTotal: number;
  campaigns: UiCampaign[];
  orders: UiOrder[];
  wallets: UiWallet[];
  primaryWalletId?: string;
  walletViews: Record<string, WalletOrgView>;
  primaryEntityId?: string;
  org: {
    active: boolean;
    done: boolean;
    inWizard: boolean;
    wallet: {
      id?: string;
      name: string;
      amount: number;
      status?: string;
      start: string;
      end: string;
      funding: string;
      docType: string;
      docNumber: string;
      uploaded: boolean;
      uploadFile: WalletUploadFile | null;
      pay: string;
      fundingApproval?: string;
      requestedAmount?: number;
    };
    departments: ReturnType<typeof mapEntityToDept>[];
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function usersMap(users: any[]) {
  return new Map(users.map((u) => [String(u._id ?? u.id), u]));
}

function fileNameFromFundingUrl(fileUrl: string): string {
  try {
    const path = new URL(fileUrl, "https://placeholder.local").pathname;
    const base = path.split("/").pop() || "Document";
    return decodeURIComponent(base);
  } catch {
    return "Document";
  }
}

type ApiWalletRow = {
  _id?: string;
  id?: string;
  name: string;
  balance: number;
  totalAmount: number;
  allocatedAmount?: number;
  validFrom?: string;
  validTo?: string;
  fundingMethod?: string;
  fundingDocument?: {
    docType?: string;
    docNumber?: string;
    fileUrl?: string;
    approvalStatus?: string;
    requestedAmount?: number;
  };
  status?: string;
  updatedAt?: string;
};

function mapWalletOrgFields(
  w: ApiWalletRow,
  isEntityManager: boolean,
  myEntity?: { allocatedAmount?: number },
): WorkspaceSnapshot["org"]["wallet"] {
  const id = String(w._id ?? w.id ?? "");
  return {
    id: id || undefined,
    name: w.name || "Merchandise Budget",
    status: w.status || "",
    amount: isEntityManager
      ? (myEntity?.allocatedAmount ?? 0)
      : (w.balance ?? w.totalAmount ?? 0),
    start: w.validFrom ? new Date(w.validFrom).toISOString().slice(0, 10) : "",
    end: w.validTo ? new Date(w.validTo).toISOString().slice(0, 10) : "",
    funding: w.fundingMethod === "online" ? "pay" : "upload",
    docType: w.fundingDocument?.docType || "Purchase Order",
    docNumber: w.fundingDocument?.docNumber || "",
    uploaded: Boolean(w.fundingDocument?.fileUrl),
    uploadFile: w.fundingDocument?.fileUrl
      ? {
          name: fileNameFromFundingUrl(w.fundingDocument.fileUrl),
          size: 0,
          source: "device",
        }
      : null,
    pay: "card",
    fundingApproval: w.fundingDocument?.approvalStatus || "",
    requestedAmount: Number(w.fundingDocument?.requestedAmount ?? 0),
  };
}

/** Resolve org snapshot for a specific wallet (defaults to primary). */
export function orgForWallet(
  workspace: WorkspaceSnapshot,
  walletId?: string,
): WorkspaceSnapshot["org"] {
  const id = walletId || workspace.primaryWalletId || workspace.org.wallet.id;
  const view = id ? workspace.walletViews[id] : undefined;
  if (view) {
    return {
      active: view.active,
      done: workspace.org.done,
      inWizard: workspace.org.inWizard,
      wallet: view.wallet,
      departments: view.departments,
    };
  }
  return workspace.org;
}

export async function fetchWorkspaceSnapshot(sessionUser?: AuthUser | null): Promise<WorkspaceSnapshot> {
  const me = sessionUser ?? getStoredUser();
  if (!me?.tenantId) throw new Error("No tenant context");

  const [
    tenant,
    shops,
    contacts,
    kits,
    collections,
    catalog,
    campaigns,
    ordersPage,
    wallets,
    entities,
    users,
  ] = await Promise.all([
    apiFetch<{ name: string; logoUrl?: string; owner?: WorkspaceOwner }>("/tenants/me"),
    apiFetch<unknown[]>("/shops"),
    apiFetch<unknown[]>("/contacts"),
    apiFetch<unknown[]>("/kits"),
    apiFetch<unknown[]>("/collections"),
    apiFetch<{ items: unknown[]; pagination?: { total?: number } }>("/catalog/products?limit=100"),
    apiFetch<unknown[]>("/campaigns").catch(() => []),
    apiFetch<{ items: unknown[] }>("/orders?limit=100"),
    apiFetch<unknown[]>("/wallets"),
    apiFetch<unknown[]>("/entities"),
    apiFetch<unknown[]>("/users").catch(() => []),
  ]);

  const userById = usersMap(users);
  const workspaceOwner = tenant.owner;
  const walletOwner = workspaceOwner
    ? { name: workspaceOwner.name, email: workspaceOwner.email }
    : undefined;
  const catalogProducts = (catalog.items || []).map(mapCatalogProduct);
  const catalogTotal = catalog.pagination?.total ?? catalogProducts.length;
  const catalogById = new Map(
    catalogProducts.filter((p) => p.id).map((p) => [p.id as string, p]),
  );

  // Collections may reference draft/archived catalog rows excluded from the tenant list.
  const collectionCatalogIds = new Set<string>();
  for (const col of collections as Array<{ productRefs?: Array<{ catalogProductId?: string }> }>) {
    for (const ref of col.productRefs || []) {
      const id = ref.catalogProductId ? String(ref.catalogProductId) : "";
      if (id && !catalogById.has(id)) collectionCatalogIds.add(id);
    }
  }
  await Promise.all(
    [...collectionCatalogIds].map(async (id) => {
      try {
        const product = await apiFetch<unknown>(`/catalog/products/${id}`);
        const mapped = mapCatalogProduct(product);
        catalogById.set(id, mapped);
        if (!catalogProducts.some((p) => p.id === id)) {
          catalogProducts.push(mapped);
        }
      } catch {
        // Linked catalog product was removed.
      }
    }),
  );

  const mappedShops = shops.map((s) => mapShop(s as never));
  const mappedCollections = (collections as never[]).map((c) => {
    const creator = userById.get(String((c as { createdBy?: string }).createdBy));
    return mapCollection(c, creator?.name || "", catalogById);
  });

  for (const shop of mappedShops) {
    shop.collections = mappedCollections
      .filter((c) => {
        const linked = c.shopIds?.length ? c.shopIds : c.shopId ? [c.shopId] : [];
        return linked.includes(shop.id);
      })
      .map((c) => c.id);
  }

  const walletList = wallets as ApiWalletRow[];
  // Surface an in-progress wallet that still needs allocation before the live one.
  const stuckSetup = [...walletList]
    .filter(
      (w) =>
        ["entities_added", "budget_allocated", "managers_assigned"].includes(w.status ?? "") &&
        (w.balance ?? 0) > 0 &&
        (w.allocatedAmount ?? 0) === 0,
    )
    .sort(
      (a, b) =>
        new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime(),
    )[0];
  const fundedSetup = [...walletList]
    .filter((w) => (w.balance ?? 0) > 0 || (w.totalAmount ?? 0) > 0)
    .sort(
      (a, b) =>
        new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime(),
    )[0];
  const primaryWallet =
    stuckSetup ??
    walletList.find((w) => w.status === "active") ??
    fundedSetup ??
    [...walletList].sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0))[0];

  const primaryWalletId = primaryWallet
    ? String(primaryWallet._id ?? primaryWallet.id ?? "")
    : "";

  const isEntityManager = me.role === "entity_manager";
  const assignedEntities = entities as never[];

  const walletEntities = isEntityManager
    ? assignedEntities
    : primaryWalletId
      ? (entities as never[]).filter(
          (e) => String((e as { walletId: string }).walletId) === primaryWalletId,
        )
      : (entities as never[]);

  const myEntity = isEntityManager
    ? ((me.assignedEntityIds?.length
        ? assignedEntities.find(
            (e) =>
              String((e as { _id: string })._id) === String(me.assignedEntityIds[0]),
          )
        : assignedEntities[0]) as
        | { allocatedAmount?: number; spentAmount?: number; name?: string; walletId?: string }
        | undefined)
    : undefined;

  const orgActive = isEntityManager ? Boolean(myEntity) : Boolean(primaryWallet);

  const entityRows = entities as never[];
  const walletViews: Record<string, WalletOrgView> = {};
  for (const w of walletList) {
    const id = String(w._id ?? w.id ?? "");
    if (!id) continue;
    const ents = entityRows.filter(
      (e) => String((e as { walletId: string }).walletId) === id,
    );
    walletViews[id] = {
      active: Boolean(w),
      wallet: mapWalletOrgFields(w, isEntityManager, myEntity),
      departments: ents.map((e) => mapEntityToDept(e, userById)),
    };
  }

  const auth = applyAuthUser(me, tenant.name);
  return {
    account: auth.account,
    logoUrl: tenant.logoUrl || "",
    userPatch: { ...auth.user, role: me.role },
    owner: workspaceOwner,
    shops: mappedShops,
    contacts: (contacts as never[]).map(mapContact),
    kits: (kits as never[]).map(mapKit),
    collections: mappedCollections,
    catalogProducts,
    catalogTotal,
    campaigns: (campaigns as never[]).map(mapCampaign),
    orders: (ordersPage.items || []).map((o) =>
      mapOrder(o, (o as { campaignName?: string }).campaignName || ""),
    ),
    wallets: (wallets as never[]).map((w) => mapWallet(w, walletOwner)),
    primaryWalletId: primaryWalletId || undefined,
    walletViews,
    primaryEntityId: isEntityManager
      ? (myEntity ? String((myEntity as { _id: string })._id) : undefined)
      : walletEntities[0]
        ? String((walletEntities[0] as { _id: string })._id)
        : undefined,
    org: {
      active: orgActive,
      done: false,
      inWizard: false,
      wallet: primaryWallet
        ? mapWalletOrgFields(primaryWallet, isEntityManager, myEntity)
        : mapWalletOrgFields(
            { name: "Merchandise Budget", balance: 0, totalAmount: 0 },
            isEntityManager,
            myEntity,
          ),
      departments: walletEntities.map((e) => mapEntityToDept(e, userById)),
    },
  };
}

export async function createShopApi(payload: {
  name: string;
  currencyMode: "points" | "inr" | "priceless";
  categories: string[];
  logoUrl?: string;
  bannerConfig?: Record<string, unknown>;
}) {
  const shop = await apiFetch<unknown>("/shops", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapShop(shop as never);
}

export async function publishShopApi(shopId: string) {
  const shop = await apiFetch<unknown>(`/shops/${shopId}/publish`, { method: "POST" });
  return mapShop(shop as never);
}

export async function updateShopApi(
  shopId: string,
  payload: {
    name?: string;
    logoUrl?: string;
    bannerConfig?: Record<string, unknown>;
    categories?: string[];
    selectedCatalogProductIds?: string[];
  },
) {
  const shop = await apiFetch<unknown>(`/shops/${shopId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapShop(shop as never);
}

export async function archiveShopApi(shopId: string) {
  return apiFetch<{ ok: boolean }>(`/shops/${shopId}`, { method: "DELETE" });
}

function shopCurrencyMode(currency: string): "points" | "inr" | "priceless" {
  if (currency === "INR") return "inr";
  if (currency === "Priceless") return "priceless";
  return "points";
}

export async function duplicateShopApi(shop: UiShop) {
  const draft = await createShopApi({
    name: `${shop.name} (copy)`,
    currencyMode: shopCurrencyMode(shop.currency),
    categories: shop.categories.length ? shop.categories : ["Merch"],
    logoUrl: shop.logoUrl || "",
    bannerConfig: shop.bannerConfig || {},
  });
  if (shop.selectedCatalogProductIds.length > 0) {
    return updateShopApi(draft.id, { selectedCatalogProductIds: shop.selectedCatalogProductIds });
  }
  return draft;
}

export async function createContactsApi(
  entries: Array<{
    name: string;
    email: string;
    role: string;
    phone?: string;
    department?: string;
    employeeCode?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country?: string;
    };
  }>,
) {
  const created = await Promise.all(
    entries.map((c) =>
      apiFetch<unknown>("/contacts", {
        method: "POST",
        body: JSON.stringify({
          name: c.name,
          email: c.email,
          role: c.role,
          phone: c.phone,
          department: c.department,
          employeeCode: c.employeeCode,
          address: c.address,
        }),
      }),
    ),
  );
  return created.map(mapContact);
}

export async function updateContactApi(
  contactId: string,
  payload: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    department?: string;
    employeeCode?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country?: string;
    };
  },
) {
  const contact = await apiFetch<unknown>(`/contacts/${contactId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapContact(contact as never);
}

export type ContactImportStatus = {
  status: "queued" | "processing" | "done" | "failed";
  totalRows: number;
  validCount: number;
  errorCount: number;
  errors: Array<{ row: number; message: string }>;
};

export async function uploadContactsImportApi(file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<{ importJobId: string; status: string }>("/contacts/import", {
    method: "POST",
    body: form,
  });
}

export async function fetchContactsImportStatusApi(jobId: string) {
  return apiFetch<ContactImportStatus>(`/contacts/import/${jobId}/status`);
}

export async function listContactsApi() {
  const contacts = await apiFetch<unknown[]>("/contacts");
  return contacts.map(mapContact);
}

export type TenantUser = {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string | null;
};

export async function listTenantUsersApi(): Promise<TenantUser[]> {
  return apiFetch<TenantUser[]>("/users");
}

export async function transferOwnershipApi(newOwnerUserId: string): Promise<WorkspaceOwner> {
  const res = await apiFetch<{ owner: WorkspaceOwner }>("/tenants/me/transfer-ownership", {
    method: "POST",
    body: JSON.stringify({ newOwnerUserId }),
  });
  return res.owner;
}

export async function uploadWorkspaceLogoApi(file: File): Promise<string> {
  const form = new FormData();
  form.append("logo", file);
  const res = await apiFetch<{ logoUrl: string }>("/tenants/me/logo", {
    method: "POST",
    body: form,
  });
  return res.logoUrl;
}

export async function updateWorkspaceSettingsApi(payload: { name?: string; logoUrl?: string }) {
  return apiFetch<{ name: string; logoUrl?: string }>("/tenants/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
