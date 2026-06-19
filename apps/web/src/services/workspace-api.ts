import { apiFetch } from "./api";
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

export type WorkspaceSnapshot = {
  account: string;
  userPatch: { name: string; initials: string; email: string; role: string };
  shops: UiShop[];
  contacts: UiContact[];
  kits: UiKit[];
  collections: UiCollection[];
  catalogProducts: UiProduct[];
  catalogTotal: number;
  campaigns: UiCampaign[];
  orders: UiOrder[];
  wallets: UiWallet[];
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
      pay: string;
    };
    departments: ReturnType<typeof mapEntityToDept>[];
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function usersMap(users: any[]) {
  return new Map(users.map((u) => [String(u._id), u]));
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
    apiFetch<{ name: string }>("/tenants/me"),
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
  const owner = me ? { name: me.name, email: me.email } : undefined;
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
        catalogById.set(id, mapCatalogProduct(product));
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
    fundingDocument?: { docType?: string; docNumber?: string; fileUrl?: string };
    status?: string;
    updatedAt?: string;
  };

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
  const primaryWallet =
    stuckSetup ??
    walletList.find((w) => w.status === "active") ??
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

  const auth = applyAuthUser(me, tenant.name);
  return {
    account: auth.account,
    userPatch: { ...auth.user, role: me.role },
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
    wallets: (wallets as never[]).map((w) => mapWallet(w, owner)),
    primaryEntityId: isEntityManager
      ? (myEntity ? String((myEntity as { _id: string })._id) : undefined)
      : walletEntities[0]
        ? String((walletEntities[0] as { _id: string })._id)
        : undefined,
    org: {
      active: orgActive,
      done: false,
      inWizard: false,
      wallet: {
        id: primaryWalletId || undefined,
        name: primaryWallet?.name || "Merchandise Budget",
        status: primaryWallet?.status || "",
        amount: isEntityManager
          ? (myEntity?.allocatedAmount ?? 0)
          : (primaryWallet?.balance ?? primaryWallet?.totalAmount ?? 0),
        start: primaryWallet?.validFrom
          ? new Date(primaryWallet.validFrom).toISOString().slice(0, 10)
          : "",
        end: primaryWallet?.validTo
          ? new Date(primaryWallet.validTo).toISOString().slice(0, 10)
          : "",
        funding: primaryWallet?.fundingMethod === "online" ? "pay" : "upload",
        docType: primaryWallet?.fundingDocument?.docType || "Purchase Order",
        docNumber: primaryWallet?.fundingDocument?.docNumber || "",
        uploaded: Boolean(primaryWallet?.fundingDocument?.fileUrl),
        pay: "card",
      },
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
  },
) {
  const shop = await apiFetch<unknown>(`/shops/${shopId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapShop(shop as never);
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
