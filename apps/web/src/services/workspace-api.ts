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
import { getStoredUser } from "./auth-store";

export type WorkspaceSnapshot = {
  account: string;
  userPatch: { name: string; initials: string; email: string };
  shops: UiShop[];
  contacts: UiContact[];
  kits: UiKit[];
  collections: UiCollection[];
  catalogProducts: UiProduct[];
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

export async function fetchWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  const me = getStoredUser();
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
    apiFetch<{ items: unknown[] }>("/catalog/products?limit=100"),
    apiFetch<unknown[]>("/campaigns").catch(() => []),
    apiFetch<{ items: unknown[] }>("/orders?limit=100"),
    apiFetch<unknown[]>("/wallets"),
    apiFetch<unknown[]>("/entities"),
    apiFetch<unknown[]>("/users").catch(() => []),
  ]);

  const userById = usersMap(users);
  const owner = me ? { name: me.name, email: me.email } : undefined;
  const mappedShops = shops.map((s) => mapShop(s as never));
  const mappedCollections = (collections as never[]).map((c) => {
    const creator = userById.get(String((c as { createdBy?: string }).createdBy));
    return mapCollection(c, creator?.name || "");
  });

  for (const shop of mappedShops) {
    shop.collections = mappedCollections
      .filter((c) => c.shopId === shop.id)
      .map((c) => c.id);
  }

  const primaryWallet = (wallets as never[])[0] as {
    _id: string;
    name: string;
    balance: number;
    totalAmount: number;
    validFrom?: string;
    validTo?: string;
    fundingMethod?: string;
    fundingDocument?: { docType?: string; docNumber?: string; fileUrl?: string };
    status?: string;
  } | undefined;

  const walletEntities = primaryWallet
    ? (entities as never[]).filter(
        (e) => String((e as { walletId: string }).walletId) === String(primaryWallet._id),
      )
    : (entities as never[]);

  const orgActive = Boolean(primaryWallet && primaryWallet.status === "active");

  const auth = applyAuthUser(me, tenant.name);
  return {
    account: auth.account,
    userPatch: auth.user,
    shops: mappedShops,
    contacts: (contacts as never[]).map(mapContact),
    kits: (kits as never[]).map(mapKit),
    collections: mappedCollections,
    catalogProducts: (catalog.items || []).map(mapCatalogProduct),
    campaigns: (campaigns as never[]).map(mapCampaign),
    orders: (ordersPage.items || []).map((o) =>
      mapOrder(o, (o as { campaignName?: string }).campaignName || ""),
    ),
    wallets: (wallets as never[]).map((w) => mapWallet(w, owner)),
    primaryEntityId: walletEntities[0]
      ? String((walletEntities[0] as { _id: string })._id)
      : undefined,
    org: {
      active: orgActive,
      done: false,
      inWizard: false,
      wallet: {
        id: primaryWallet ? String(primaryWallet._id) : undefined,
        name: primaryWallet?.name || "Merchandise Budget",
        amount: primaryWallet?.balance ?? primaryWallet?.totalAmount ?? 0,
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

export async function createContactsApi(
  entries: Array<{ name: string; email: string; role: string }>,
) {
  const created = await Promise.all(
    entries.map((c) =>
      apiFetch<unknown>("/contacts", {
        method: "POST",
        body: JSON.stringify({
          name: c.name,
          email: c.email,
          role: c.role,
        }),
      }),
    ),
  );
  return created.map(mapContact);
}
