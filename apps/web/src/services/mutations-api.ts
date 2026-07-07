import { ApiError, apiFetch } from "./api";
import { getStoredUser } from "./auth-store";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { mapCampaign, mapCollection, mapKit, type UiProduct } from "./mappers";

const MONGO_ID = /^[a-f0-9]{24}$/i;

type OrgWizardState = {
  wallet: {
    id?: string;
    name: string;
    amount: number;
    start: string;
    end: string;
    funding: string;
    docType: string;
    docNumber: string;
    uploadFile?: { file?: File } | null;
  };
  departments: Array<{
    id: string | number;
    name: string;
    desc: string;
    users: number;
    allocated: number;
    color: string;
    selected?: boolean;
    mgr: { name: string; email: string; mobile: string; role: string; invite: boolean };
  }>;
  createNewWallet?: boolean;
};

function walletIdFromResponse(wallet: Record<string, unknown>): string {
  const id = wallet._id ?? wallet.id;
  const normalized = normalizeMongoId(id);
  if (!normalized || !MONGO_ID.test(normalized)) {
    throw new Error("Wallet create response missing a valid id");
  }
  return normalized;
}

function normalizeMongoId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in value) {
    return normalizeMongoId((value as { _id: unknown })._id);
  }
  return String(value);
}

async function ensureWalletFunded(
  walletId: string,
  amount: number,
  fundingMethod: "po_upload" | "online" = "po_upload",
): Promise<void> {
  if (amount <= 0) return;
  const existing = await apiFetch<{
    balance?: number;
    fundingMethod?: string;
    fundingDocument?: { approvalStatus?: string };
  }>(`/wallets/${walletId}`);
  const method = existing.fundingMethod ?? fundingMethod;
  const approval = existing.fundingDocument?.approvalStatus ?? "";

  if (method === "po_upload") {
    if (approval === "pending") return;
    if (approval === "approved" && Number(existing.balance ?? 0) > 0) return;
    try {
      await apiFetch(`/wallets/${walletId}/fund`, {
        method: "POST",
        idempotencyKey: `fund-${walletId}-setup`,
        body: JSON.stringify({
          amount,
          description: "Organization wallet setup funding",
        }),
      });
    } catch (err) {
      if (err instanceof ApiError && err.code === "FUNDING_PENDING") return;
      throw err;
    }
    return;
  }

  // Online funding uses Razorpay checkout — not POST /fund.
}

async function tryResolveExistingWalletId(id: string): Promise<string | null> {
  if (!MONGO_ID.test(id)) return null;
  try {
    await apiFetch(`/wallets/${id}`);
    return id;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function uploadWalletFundingDocumentApi(walletId: string, file: File) {
  const form = new FormData();
  form.append("document", file);
  return apiFetch<Record<string, unknown>>(`/wallets/${walletId}/funding-document`, {
    method: "POST",
    body: form,
  });
}

async function rollbackIncompleteWallet(walletId: string): Promise<void> {
  try {
    await apiFetch(`/wallets/${walletId}`, { method: "DELETE" });
  } catch {
    // Best-effort cleanup; the original error is still thrown to the caller.
  }
}

async function cleanupOrphanDraftByName(name: string): Promise<void> {
  const nameKey = name.trim().toLowerCase();
  if (!nameKey) return;
  try {
    const wallets = await apiFetch<Array<Record<string, unknown>>>("/wallets");
    for (const row of wallets) {
      const rowName = String(row.name ?? "").trim().toLowerCase();
      const status = String(row.status ?? "draft");
      const approval = (row.fundingDocument as { approvalStatus?: string } | undefined)
        ?.approvalStatus;
      if (rowName !== nameKey || status !== "draft" || approval === "pending") continue;
      const id = normalizeMongoId(row._id ?? row.id);
      if (MONGO_ID.test(id)) await rollbackIncompleteWallet(id);
    }
  } catch {
    // Best-effort only.
  }
}

async function findRecoverableWalletId(name: string): Promise<string | null> {
  const nameKey = name.trim().toLowerCase();
  if (!nameKey) return null;
  try {
    const wallets = await apiFetch<Array<Record<string, unknown>>>("/wallets");
    const match = wallets.find((row) => {
      const rowName = String(row.name ?? "").trim().toLowerCase();
      if (rowName !== nameKey) return false;
      const status = String(row.status ?? "draft");
      const approval = (row.fundingDocument as { approvalStatus?: string } | undefined)
        ?.approvalStatus;
      if (approval === "pending") return true;
      return status === "draft" && Number(row.balance ?? 0) === 0;
    });
    if (!match) return null;
    return walletIdFromResponse(match);
  } catch {
    return null;
  }
}

async function createWalletAndFund(org: OrgWizardState): Promise<string> {
  const fundingMethod = org.wallet.funding === "pay" ? "online" : "po_upload";
  const form = new FormData();
  form.append("name", org.wallet.name);
  form.append("currency", "INR");
  if (org.wallet.start) form.append("validFrom", org.wallet.start);
  if (org.wallet.end) form.append("validTo", org.wallet.end);
  form.append("fundingMethod", fundingMethod);
  form.append("docType", org.wallet.docType || "");
  form.append("docNumber", org.wallet.docNumber || "");
  form.append("amount", String(org.wallet.amount));
  if (fundingMethod === "po_upload" && org.wallet.uploadFile?.file) {
    form.append("document", org.wallet.uploadFile.file);
  }

  const existing = await findRecoverableWalletId(org.wallet.name);
  if (existing) return existing;

  try {
    const wallet = await apiFetch<Record<string, unknown>>("/wallets/setup", {
      method: "POST",
      body: form,
    });
    return walletIdFromResponse(wallet);
  } catch (err) {
    const recovered = await findRecoverableWalletId(org.wallet.name);
    if (recovered) return recovered;
    await cleanupOrphanDraftByName(org.wallet.name);
    throw err;
  }
}

/** Step 1 only — create wallet, upload PO, submit funding request for finance review. */
export async function createWalletOnlyApi(
  org: Pick<OrgWizardState, "wallet">,
): Promise<{ walletId: string }> {
  const walletId = await createWalletAndFund(org as OrgWizardState);
  return { walletId };
}

async function resolveWalletId(org: OrgWizardState, createNewWallet = false): Promise<string> {
  if (createNewWallet) {
    return createWalletAndFund(org);
  }

  let candidate = org.wallet.id?.trim();
  const tenantId = getStoredUser()?.tenantId;

  // Stale UI state sometimes stores tenantId where a wallet id belongs.
  if (candidate && tenantId && candidate === tenantId) {
    candidate = undefined;
  }

  if (candidate) {
    const resolved = await tryResolveExistingWalletId(candidate);
    if (resolved) {
      await ensureWalletFunded(
        resolved,
        org.wallet.amount,
        org.wallet.funding === "pay" ? "online" : "po_upload",
      );
      return resolved;
    }
  }

  // Reuse an existing tenant wallet before creating a duplicate.
  const wallets = await apiFetch<Array<Record<string, unknown>>>("/wallets");
  const nameKey = org.wallet.name?.trim().toLowerCase();
  const ranked = [...wallets].sort(
    (a, b) => Number(b.balance ?? 0) - Number(a.balance ?? 0),
  );
  const byName = nameKey
    ? ranked.find((w) => String(w.name ?? "").trim().toLowerCase() === nameKey)
    : undefined;
  if (byName) {
    const walletId = walletIdFromResponse(byName);
    await ensureWalletFunded(
      walletId,
      org.wallet.amount,
      org.wallet.funding === "pay" ? "online" : "po_upload",
    );
    return walletId;
  }

  return createWalletAndFund(org);
}

function productRefFromUi(p: UiProduct) {
  if (!p.id) throw new Error(`Product "${p.nm}" has no catalog id — reload the catalog`);
  const mockupUrl = p.mockupUrl ? resolveMediaUrl(p.mockupUrl) : "";
  return {
    catalogProductId: p.id,
    brand: p.brand || "",
    name: p.nm,
    group: p.g || "tee",
    ...(mockupUrl ? { mockupUrl } : {}),
  };
}

function collectionMediaUrl(url?: string) {
  if (!url || url.startsWith("blob:")) return "";
  return resolveMediaUrl(url);
}

function cleanPreferredColors(colors?: string[]) {
  return (colors || []).filter((c) => typeof c === "string" && c.trim());
}

export async function createKitApi(payload: {
  name: string;
  pickedIndices: number[];
  catalog: UiProduct[];
  packaging: "none" | "box";
  designNotes?: string;
}) {
  const productRefs = payload.pickedIndices.map((i) => {
    const p = payload.catalog[i];
    if (!p) throw new Error("Invalid product selection");
    return productRefFromUi(p);
  });
  const kit = await apiFetch<Record<string, unknown>>("/kits", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      productRefs,
      packaging: payload.packaging === "box" ? "box" : "none",
      designNotes: payload.designNotes || "",
      status: "live",
    }),
  });
  return mapKit(kit);
}

export async function updateKitApi(payload: {
  id: string;
  name?: string;
  pickedIndices: number[];
  catalog: UiProduct[];
  packaging?: "none" | "box";
  designNotes?: string;
  status?: string;
}) {
  const productRefs = payload.pickedIndices.map((i) => {
    const p = payload.catalog[i];
    if (!p) throw new Error("Invalid product selection");
    return productRefFromUi(p);
  });
  const body: Record<string, unknown> = { productRefs };
  if (payload.name != null) body.name = payload.name;
  if (payload.packaging != null) body.packaging = payload.packaging;
  if (payload.designNotes != null) body.designNotes = payload.designNotes;
  if (payload.status != null) body.status = payload.status;

  const kit = await apiFetch<Record<string, unknown>>(`/kits/${payload.id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return mapKit(kit);
}

export async function uploadKitArtworkApi(kitId: string, file: File) {
  const form = new FormData();
  form.append("artwork", file);
  const kit = await apiFetch<Record<string, unknown>>(`/kits/${kitId}/artwork`, {
    method: "POST",
    body: form,
  });
  return mapKit(kit);
}

type ArtworkInput = { file?: File; preview?: string; name?: string };

async function artworkFileFromInput(art: ArtworkInput): Promise<File | null> {
  if (art.file instanceof File) return art.file;
  if (art.preview?.startsWith("data:")) {
    const res = await fetch(art.preview);
    const blob = await res.blob();
    return new File([blob], art.name || "artwork.png", { type: blob.type || "image/png" });
  }
  return null;
}

export async function uploadCollectionArtworkApi(collectionId: string, file: File) {
  const form = new FormData();
  form.append("artwork", file);
  const col = await apiFetch<Record<string, unknown>>(`/collections/${collectionId}/artwork`, {
    method: "POST",
    body: form,
  });
  return mapCollection(col);
}

type MockupUploadItem = { catalogProductId: string; dataUrl: string };

export async function uploadCollectionMockupsApi(
  collectionId: string,
  items: MockupUploadItem[],
  catalogById?: Map<string, UiProduct>,
) {
  const meta: Array<{ catalogProductId: string }> = [];
  const form = new FormData();
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.dataUrl?.startsWith("data:")) continue;
    const res = await fetch(item.dataUrl);
    const blob = await res.blob();
    form.append("mockups", new File([blob], `mockup-${i}.png`, { type: blob.type || "image/png" }));
    meta.push({ catalogProductId: item.catalogProductId });
  }
  if (!meta.length) return null;
  form.append("meta", JSON.stringify(meta));
  const col = await apiFetch<Record<string, unknown>>(`/collections/${collectionId}/mockups`, {
    method: "POST",
    body: form,
  });
  return mapCollection(col, "", catalogById);
}

export async function linkCollectionToShopApi(collectionId: string, shopId: string) {
  const col = await apiFetch<Record<string, unknown>>(`/collections/${collectionId}`, {
    method: "PATCH",
    body: JSON.stringify({ shopId }),
  });
  return mapCollection(col);
}

export async function archiveCollectionApi(collectionId: string) {
  const col = await apiFetch<Record<string, unknown>>(`/collections/${collectionId}/archive`, {
    method: "POST",
  });
  return mapCollection(col);
}

export async function restoreCollectionApi(collectionId: string) {
  const col = await apiFetch<Record<string, unknown>>(`/collections/${collectionId}/restore`, {
    method: "POST",
  });
  return mapCollection(col);
}

export async function deleteCollectionApi(collectionId: string) {
  await apiFetch(`/collections/${collectionId}`, { method: "DELETE" });
}

export async function addProductToShopApi(payload: {
  shopId: string;
  collection: { name: string; artworkUrl?: string; preferredColors?: string[] };
  product: UiProduct;
  catalog: UiProduct[];
}) {
  const catalogProduct =
    payload.catalog.find((p) => p.id && p.id === payload.product.id) ||
    payload.product;
  if (!catalogProduct.id) {
    throw new Error("Could not match this product to the catalog");
  }

  const productRef = {
    ...productRefFromUi(catalogProduct),
    ...(payload.product.mockupUrl
      ? { mockupUrl: resolveMediaUrl(payload.product.mockupUrl) }
      : {}),
  };
  const catalogById = new Map(
    payload.catalog.filter((p) => p.id).map((p) => [p.id as string, p]),
  );
  const body = {
    name: payload.collection.name,
    productRefs: [productRef],
    preferredColors: cleanPreferredColors(payload.collection.preferredColors),
    shopId: payload.shopId,
    artworkUrl: collectionMediaUrl(payload.collection.artworkUrl),
    isShopSpecific: true,
  };

  const col = await apiFetch<Record<string, unknown>>("/collections", {
    method: "POST",
    body: JSON.stringify(body),
  });
  let result = mapCollection(col, "", catalogById);

  const mockup = resolveMediaUrl(payload.product.mockupUrl);
  if (mockup?.startsWith("data:") && catalogProduct.id) {
    const withMockups = await uploadCollectionMockupsApi(
      result.id,
      [{ catalogProductId: catalogProduct.id, dataUrl: mockup }],
      catalogById,
    );
    if (withMockups) result = withMockups;
  }

  return result;
}

export async function createCollectionApi(payload: {
  shopId?: string;
  name: string;
  pickedIndices: number[];
  catalog: UiProduct[];
  preferredColors?: string[];
  artworkUrl?: string;
  artwork?: ArtworkInput;
  mockups?: MockupUploadItem[];
  isShopSpecific?: boolean;
}) {
  const productRefs = payload.pickedIndices.map((i) => {
    const p = payload.catalog[i];
    if (!p) throw new Error("Invalid product selection");
    return productRefFromUi(p);
  });
  const catalogById = new Map(
    payload.catalog.filter((p) => p.id).map((p) => [p.id as string, p]),
  );
  const body: Record<string, unknown> = {
    name: payload.name,
    productRefs,
    preferredColors: cleanPreferredColors(payload.preferredColors),
  };
  if (payload.shopId) body.shopId = payload.shopId;
  if (payload.artworkUrl) body.artworkUrl = collectionMediaUrl(payload.artworkUrl);
  if (payload.isShopSpecific) body.isShopSpecific = true;
  const col = await apiFetch<Record<string, unknown>>("/collections", {
    method: "POST",
    body: JSON.stringify(body),
  });
  let result = mapCollection(col, "", catalogById);
  if (payload.artwork) {
    const file = await artworkFileFromInput(payload.artwork);
    if (file) result = await uploadCollectionArtworkApi(result.id, file);
  }
  if (payload.mockups?.length) {
    const withMockups = await uploadCollectionMockupsApi(result.id, payload.mockups, catalogById);
    if (!withMockups) {
      throw new Error("Failed to save product mockups — try generating designs again");
    }
    result = withMockups;
  }
  return result;
}

export async function getCampaignApi(campaignId: string) {
  const campaign = await apiFetch<Record<string, unknown>>(`/campaigns/${campaignId}`);
  return mapCampaign(campaign);
}

export async function savePointsCampaignDraftApi(payload: {
  campaignId?: string;
  entityId: string;
  shopId: string;
  name: string;
  pointsScope?: "stadium" | "shop";
  creditsPerRecipient: number;
  message: { from: string; body: string };
  schedule?: { mode: "now" | "scheduled" | "self"; sendAt?: string | null; timezone?: string };
  draftState: {
    step: 0 | 1 | 2 | 3;
    selectedWalletId: string;
    selRecips: string[];
    recips: number;
    pay: "wallet" | "card";
    preview: "landing" | "email";
    when: "now" | "scheduled" | "self";
  };
  recipients?: Array<{ name: string; email: string; phone?: string; contactId?: string }>;
}) {
  const campaign = await apiFetch<Record<string, unknown>>("/campaigns/points-draft", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapCampaign(campaign);
}

export async function deleteCampaignApi(campaignId: string) {
  return apiFetch<{ ok: boolean }>(`/campaigns/${campaignId}`, { method: "DELETE" });
}

export type CampaignRecipientRow = {
  _id?: string;
  name: string;
  email: string;
  creditAmount?: number;
  redemptionStatus?: string;
};

export async function fetchCampaignReportApi(campaignId: string) {
  return apiFetch<{ recipients: CampaignRecipientRow[] }>(`/campaigns/${campaignId}/report`);
}

export async function launchPointsCampaignApi(payload: {
  campaignId?: string;
  entityId: string;
  shopId: string;
  name: string;
  pointsScope?: "stadium" | "shop";
  creditsPerRecipient: number;
  totalBudget?: number;
  message: { from: string; body: string };
  recipients: Array<{ name: string; email: string; phone?: string; contactId?: string }>;
}) {
  let campaignId = payload.campaignId;
  let existingStatus: string | undefined;

  if (campaignId) {
    const existing = await apiFetch<Record<string, unknown>>(`/campaigns/${campaignId}`);
    existingStatus = String(existing.status ?? "");
    await apiFetch(`/campaigns/${campaignId}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: payload.name,
        pointsScope: payload.pointsScope ?? "shop",
        message: payload.message,
        schedule: { mode: "now" },
      }),
    });
  } else {
    const campaign = await apiFetch<Record<string, unknown>>("/campaigns", {
      method: "POST",
      body: JSON.stringify({
        entityId: payload.entityId,
        name: payload.name,
        type: "points",
        shopId: payload.shopId,
        pointsScope: payload.pointsScope ?? "shop",
        message: payload.message,
        schedule: { mode: "now" },
      }),
    });
    campaignId = String(campaign._id);
    existingStatus = String(campaign.status ?? "draft");
  }

  const canImport = !existingStatus || ["draft", "recipients_uploaded"].includes(existingStatus);
  if (canImport && payload.recipients.length) {
    await apiFetch(`/campaigns/${campaignId}/recipients/import`, {
      method: "POST",
      body: JSON.stringify({
        recipients: payload.recipients.map((r) => ({
          name: r.name,
          email: r.email,
          phone: r.phone || "",
          ...(r.contactId ? { contactId: r.contactId } : {}),
        })),
      }),
    });
    existingStatus = "recipients_uploaded";
  }

  if (!existingStatus || existingStatus === "recipients_uploaded" || existingStatus === "draft") {
    await apiFetch(`/campaigns/${campaignId}/allocate-credits`, {
      method: "POST",
      body: JSON.stringify({
        creditsPerRecipient: payload.creditsPerRecipient,
        ...(payload.totalBudget != null ? { totalBudget: payload.totalBudget } : {}),
      }),
    });
  }

  const launched = await apiFetch<Record<string, unknown>>(`/campaigns/${campaignId}/launch`, {
    method: "POST",
    idempotencyKey: `launch-${campaignId}-${Date.now()}`,
  });
  return mapCampaign(launched);
}

export async function launchKitCampaignApi(payload: {
  entityId: string;
  kitId: string;
  name: string;
  totalBudget?: number;
  fulfillmentMode?: "redeem" | "surprise" | "single";
  singleLocation?: {
    name: string;
    email: string;
    phone?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  message: { from: string; body: string };
  schedule?: { mode: "now" | "scheduled" | "self"; sendAt?: string | null; timezone?: string };
  recipients: Array<{ contactId?: string; name: string; email: string; phone?: string }>;
}) {
  const campaign = await apiFetch<Record<string, unknown>>("/campaigns", {
    method: "POST",
    body: JSON.stringify({
      entityId: payload.entityId,
      name: payload.name,
      type: "kit",
      fulfillmentMode: payload.fulfillmentMode ?? "redeem",
      singleLocation: payload.singleLocation,
      kitId: payload.kitId,
      message: payload.message,
      schedule: payload.schedule ?? { mode: "now" },
    }),
  });
  const campaignId = String(campaign._id);

  await apiFetch(`/campaigns/${campaignId}/recipients/import`, {
    method: "POST",
    body: JSON.stringify({
      recipients: payload.recipients.map((r) => ({
        contactId: r.contactId,
        name: r.name,
        email: r.email,
        phone: r.phone || "",
      })),
      ...(payload.totalBudget != null ? { totalBudget: payload.totalBudget } : {}),
    }),
  });

  const launched = await apiFetch<Record<string, unknown>>(`/campaigns/${campaignId}/launch`, {
    method: "POST",
    idempotencyKey: `launch-kit-${campaignId}-${Date.now()}`,
  });
  return mapCampaign(launched);
}

export type OrgWizardInvite = {
  email: string;
  name: string;
  entityName: string;
  inviteToken?: string;
};

type ApiEntityRow = {
  _id?: string;
  id?: string;
  name?: string;
  walletId?: string;
  allocatedAmount?: number;
  managerEmail?: string;
  managerName?: string;
  managerUserId?: { email?: string } | string;
};

export async function fundWalletApi(
  walletId: string,
  payload: {
    amount: number;
    description?: string;
    fundingMethod?: "po_upload" | "online";
    docType?: string;
    docNumber?: string;
  },
): Promise<{ pending?: boolean; wallet?: { balance?: number }; transaction?: { _id?: string } }> {
  return apiFetch(`/wallets/${walletId}/fund`, {
    method: "POST",
    idempotencyKey: `fund-${walletId}-${payload.amount}-${Date.now()}`,
    body: JSON.stringify({
      amount: payload.amount,
      description: payload.description || "Wallet top-up",
      fundingMethod: payload.fundingMethod,
      docType: payload.docType,
      docNumber: payload.docNumber,
    }),
  });
}

export type RazorpayOrderResult = {
  orderId: string;
  amount: number;
  amountPaise: number;
  currency: string;
  keyId: string;
  paymentId: string;
  walletId: string;
};

export async function createRazorpayOrderApi(
  walletId: string,
  amount: number,
): Promise<RazorpayOrderResult> {
  return apiFetch("/payments/razorpay/order", {
    method: "POST",
    idempotencyKey: `rzp-order-${walletId}-${amount}-${Date.now()}`,
    body: JSON.stringify({ walletId, amount }),
  });
}

export type WalletTransactionRow = {
  _id?: string;
  type: string;
  amount: number;
  balanceAfter?: number;
  relatedEntityId?: string;
  description?: string;
  createdAt?: string;
};

export async function fetchWalletTransactionsApi(
  walletId: string,
  limit = 20,
): Promise<WalletTransactionRow[]> {
  const res = await apiFetch<{ items?: WalletTransactionRow[] }>(
    `/wallets/${walletId}/transactions?limit=${limit}`,
  );
  return res.items ?? [];
}

export async function syncOrgWizardApi(
  org: OrgWizardState,
): Promise<{ walletId: string; invites: OrgWizardInvite[] }> {
  const walletId = org.wallet.id?.trim();
  if (!walletId || !MONGO_ID.test(walletId)) {
    throw new Error("No wallet found. Create and fund your wallet first.");
  }
  const defaultWalletId = walletId;
  const allocationsByWallet = new Map<string, Array<{ entityId: string; amount: number }>>();
  const walletsToActivate = new Set<string>();
  const invites: OrgWizardInvite[] = [];

  const pushAllocation = (walletId: string, entityId: string, amount: number) => {
    if (amount === 0) return;
    const list = allocationsByWallet.get(walletId) ?? [];
    list.push({ entityId, amount });
    allocationsByWallet.set(walletId, list);
    walletsToActivate.add(walletId);
  };

  const allocationDeltas: Array<{ walletId: string; entityId: string; delta: number }> = [];
  const plannedAllocations: Array<{ entityId: string; amount: number }> = [];

  const allEntities = await apiFetch<ApiEntityRow[]>("/entities");
  const walletEntities = (allEntities ?? []).filter(
    (entity) => normalizeMongoId(entity.walletId) === defaultWalletId,
  );
  const entityByName = new Map<string, ApiEntityRow>();
  for (const entity of walletEntities ?? []) {
    const name = String(entity.name ?? "").trim().toLowerCase();
    if (name) entityByName.set(name, entity);
  }
  const managerEmailOf = (entity: ApiEntityRow) => {
    const populated =
      typeof entity.managerUserId === "object" ? entity.managerUserId.email : "";
    return String(entity.managerEmail ?? populated ?? "").trim().toLowerCase();
  };
  const identityKey = (name?: string, email?: string) => {
    const n = String(name ?? "").trim().toLowerCase();
    const e = String(email ?? "").trim().toLowerCase();
    return n && e ? `${n}|${e}` : "";
  };
  const entityByDepartmentManager = new Map<string, ApiEntityRow>();
  for (const entity of walletEntities ?? []) {
    const key = identityKey(entity.name, managerEmailOf(entity));
    if (key) entityByDepartmentManager.set(key, entity);
  }

  const entityBelongsToWallet = (entity: ApiEntityRow) =>
    normalizeMongoId(entity.walletId) === defaultWalletId;

  type EntityPlan = {
    dept: (typeof org.departments)[number];
    entityId: string;
    target: number;
    currentAllocated: number;
  };
  const entityPlans = new Map<string, EntityPlan>();

  for (const dept of org.departments) {
    const existingId = String(dept.id);
    const isMongoId = MONGO_ID.test(existingId);
    let entityId = isMongoId ? existingId : "";
    let currentAllocated = 0;

    if (entityId) {
      const entity = await apiFetch<ApiEntityRow>(`/entities/${entityId}`);
      const entityWalletId = normalizeMongoId(entity.walletId);
      if (entityWalletId && entityWalletId !== defaultWalletId) {
        entityId = "";
        currentAllocated = 0;
      } else {
        currentAllocated = Number(entity.allocatedAmount ?? 0);
        await apiFetch(`/entities/${entityId}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: dept.name,
            description: dept.desc || "",
            colorHex: dept.color || "#2563EB",
            expectedUsers: dept.users || 0,
            managerEmail: entity.managerEmail,
            managerName: entity.managerName,
          }),
        });
      }
    }

    if (!entityId) {
      const byIdentity = entityByDepartmentManager.get(
        identityKey(dept.name, dept.mgr?.email),
      );
      const byName = byIdentity ?? entityByName.get(dept.name.trim().toLowerCase());
      if (byName && entityBelongsToWallet(byName)) {
        entityId = normalizeMongoId(byName._id ?? byName.id);
        currentAllocated = Number(byName.allocatedAmount ?? 0);
        await apiFetch(`/entities/${entityId}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: dept.name,
            description: dept.desc || "",
            colorHex: dept.color || "#2563EB",
            expectedUsers: dept.users || 0,
          }),
        });
      }
    }

    if (!entityId) {
      const entity = await apiFetch<ApiEntityRow>("/entities", {
        method: "POST",
        body: JSON.stringify({
          walletId: defaultWalletId,
          name: dept.name,
          description: dept.desc || "",
          colorHex: dept.color || "#2563EB",
          expectedUsers: dept.users || 0,
        }),
      });
      entityId = normalizeMongoId(entity._id ?? entity.id);
    }

    const selected = (dept as { selected?: boolean }).selected !== false;
    if (!selected) continue;

    const target = Number(dept.allocated) || 0;
    const prev = entityPlans.get(entityId);
    if (!prev) {
      entityPlans.set(entityId, { dept, entityId, target, currentAllocated });
    }
  }

  for (const { dept, entityId, target, currentAllocated } of entityPlans.values()) {
    const mgrEmail = dept.mgr?.email?.trim();
    if (mgrEmail) {
      const mgrName = dept.mgr.name?.trim() || mgrEmail.split("@")[0] || "Manager";
      const res = await apiFetch<{
        manager?: { email?: string };
        inviteToken?: string;
      }>(`/entities/${entityId}/assign-manager`, {
        method: "POST",
        body: JSON.stringify({
          name: mgrName,
          email: mgrEmail,
          role: dept.mgr.role || "",
          mobile: dept.mgr.mobile || "",
          sendInvite: Boolean(dept.mgr.invite),
        }),
      });
      if (dept.mgr.invite) {
        invites.push({
          email: mgrEmail,
          name: mgrName,
          entityName: dept.name,
          inviteToken: res.inviteToken,
        });
      }
    } else if (dept.mgr?.name?.trim() || dept.mgr?.role?.trim()) {
      await apiFetch(`/entities/${entityId}`, {
        method: "PATCH",
        body: JSON.stringify({
          managerName: dept.mgr.name?.trim() || "",
          managerTitle: dept.mgr.role || "",
        }),
      });
    }

    if (target > 0) {
      plannedAllocations.push({ entityId, amount: target });
    }

    const delta = target - currentAllocated;
    if (delta !== 0) {
      allocationDeltas.push({ walletId: defaultWalletId, entityId, delta });
    }
  }

  allocationDeltas.sort((a, b) => a.delta - b.delta);
  for (const { walletId, entityId, delta } of allocationDeltas) {
    pushAllocation(walletId, entityId, delta);
  }

  const walletMeta = await apiFetch<{
    fundingMethod?: string;
    fundingDocument?: { approvalStatus?: string };
  }>(`/wallets/${defaultWalletId}`);
  const poPending =
    walletMeta.fundingMethod === "po_upload" &&
    walletMeta.fundingDocument?.approvalStatus === "pending";

  if (poPending) {
    if (plannedAllocations.length > 0) {
      await apiFetch(`/wallets/${defaultWalletId}`, {
        method: "PATCH",
        body: JSON.stringify({
          fundingDocument: { plannedAllocations },
        }),
      });
    }
    return { walletId: defaultWalletId, invites };
  }

  for (const [walletId, allocations] of allocationsByWallet) {
    if (!allocations.length) continue;
    const ordered = [...allocations].sort((a, b) => a.amount - b.amount);
    await apiFetch(`/wallets/${walletId}/allocate`, {
      method: "POST",
      idempotencyKey: `alloc-${walletId}-${Date.now()}-${ordered.map((a) => `${a.entityId}:${a.amount}`).join("|")}`,
      body: JSON.stringify({ allocations: ordered }),
    });
  }

  for (const walletId of walletsToActivate) {
    await apiFetch(`/wallets/${walletId}/activate`, { method: "POST" });
  }

  return { walletId: defaultWalletId, invites };
}
