import { useMemo, useReducer, useState, useEffect, type Dispatch } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { useWorkspace, useInvalidateWorkspace } from "@/hooks/useWorkspace";
import { formatWalletAmount } from "@/lib/walletFormat";
import type { UiContact, UiProduct } from "@/services/mappers";
import type { UiWallet } from "@/services/mappers";
import { ensureSpendEntityForWalletApi } from "@/services/mutations-api";
import { entityIdForWallet, spendableForWallet, walletsForCheckout } from "@/services/workspace-api";
import { kitSendTotals, type KitSendTotals } from "@/features/send/money";
import { toSchedulePayload } from "@/features/send/types";
import { kitPickedIndices } from "../wizard/kitDraft";
import { useLaunchKitCampaign, useUpdateKit } from "../model";
import type { UiKit } from "../model";
import {
  initialSendKitDraft,
  sendKitReducer,
  type SendKitAction,
  type SendKitDraft,
} from "../send/sendDraft";

const NO_SIZE_GROUPS = new Set([
  'bottle',
  'mug',
  'tumbler',
  'drinkware',
  'pen',
  'notebook',
  'pack',
  'bag',
  'cap',
  'hat',
  'keychain',
  'sticker',
  'tech',
  'charger',
  'speaker',
]);

const APPAREL_GROUPS = new Set([
  'tee',
  'hoodie',
  'polo',
  'shirt',
  'sweatshirt',
  'jacket',
  'pant',
  'pants',
  'shorts',
  'apron',
  'tank',
  'crew',
]);

const DEFAULT_APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const STANDARD_SIZES = new Set(['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL']);

const GROUP_BY_CATEGORY: Record<string, string> = {
  Apparel: 'tee',
  Drinkware: 'bottle',
  Bags: 'bag',
  Technology: 'power',
  Office: 'note',
  'Health & Wellness': 'pillow',
  'Food & Beverages': 'bottle',
};

const DRINKWARE_NAME = /\bbottle\b|\bmug\b|\btumbler\b|\bflask\b|\bdrinkware\b/i;

function distinctVariantValues(variants: any[] | undefined, key: string): string[] {
  return [...new Set((variants || []).map((v) => v[key]).filter(Boolean))] as string[];
}

function effectiveProductGroup(product: UiProduct, ref: any = {}) {
  const fromProduct = String(product.g || '').toLowerCase().trim();
  if (fromProduct) return fromProduct;
  const fromCategory = GROUP_BY_CATEGORY[product.category || ''];
  if (fromCategory) return fromCategory.toLowerCase();
  return String(ref.group || '').toLowerCase().trim();
}

function isDrinkwareProduct(product: UiProduct, ref: any = {}) {
  const group = effectiveProductGroup(product, ref);
  const category = String(product.category || '').toLowerCase();
  const name = String(ref.name || product.nm || '');

  if (NO_SIZE_GROUPS.has(group) && !['pack', 'bag'].includes(group)) return true;
  if (/drink|bottle|mug|tumbler|beverage/.test(category)) return true;
  if (DRINKWARE_NAME.test(name)) return true;
  return false;
}

function isApparelProduct(product: UiProduct, ref: any = {}) {
  if (isDrinkwareProduct(product, ref)) return false;
  const group = effectiveProductGroup(product, ref);
  const category = String(product.category || '').toLowerCase();
  return APPAREL_GROUPS.has(group) || category === 'apparel';
}

function hasStandardSizes(sizes: string[]) {
  return sizes.some((s) => STANDARD_SIZES.has(String(s).toUpperCase()));
}

export function resolveKitItemOptions(product: UiProduct, ref: any = {}) {
  const rawSizes = distinctVariantValues(product.variants, 'size');
  const rawColors = distinctVariantValues(product.variants, 'color');

  if (isDrinkwareProduct(product, ref)) {
    return {
      sizes: rawSizes,
      colors: rawColors,
      requiresSize: rawSizes.length > 0,
      requiresColor: rawColors.length > 0,
    };
  }

  if (isApparelProduct(product, ref)) {
    let sizes = hasStandardSizes(rawSizes) ? rawSizes.filter((s) => STANDARD_SIZES.has(String(s).toUpperCase())) : [];
    if (!sizes.length) sizes = DEFAULT_APPAREL_SIZES;
    return {
      sizes,
      colors: rawColors,
      requiresSize: sizes.length > 0,
      requiresColor: rawColors.length > 0,
    };
  }

  return {
    sizes: rawSizes,
    colors: rawColors,
    requiresSize: rawSizes.length > 0,
    requiresColor: rawColors.length > 0,
  };
}

export function getCuratedKitMeta(kit: UiKit | undefined) {
  if (!kit?.designNotes) return null;
  try {
    const parsed = JSON.parse(kit.designNotes);
    if (parsed && parsed.curated) {
      return parsed as { curated: boolean; originalId: string; description: string; imageUrls: string[] };
    }
  } catch {
    // ignore
  }
  return null;
}

export type SendKitStep = 0 | 1 | 2 | 3;

export type SendKitVm = {
  isLoading: boolean;
  isSending: boolean;
  notFound: boolean;
  kit: UiKit | undefined;
  account: string | undefined;
  shopName: string | undefined;
  step: SendKitStep;
  draft: SendKitDraft;
  dispatch: Dispatch<SendKitAction>;
  contacts: UiContact[];
  catalog: UiProduct[];
  totals: KitSendTotals;
  surpriseMissing: UiContact[];
  wallet: UiWallet | undefined;
  wallets: UiWallet[];
  selectedWalletId: string | undefined;
  onWalletSelect: (walletId: string) => void;
  walletAvailable: (wallet: UiWallet) => number;
  onExit: () => void;
  onNext: () => void;
  onBack: () => void;
  onPayAndSend: () => void;
  kitName: string;
  setKitName: (name: string) => void;
};

function missingAddress(contacts: UiContact[], selected: string[]): UiContact[] {
  return contacts.filter(
    (c) => selected.includes(c.id) && (!c.address || !c.city || !c.state || !c.pincode),
  );
}

/** Controller for the send-kit wizard: recipient/experience/checkout state, pay flow. */
export function useSendKitController(): SendKitVm {
  const navigate = useNavigate();
  const { id } = useParams() as { id: string };
  const { data: workspace, isLoading } = useWorkspace();
  const refreshWorkspace = useInvalidateWorkspace();
  const launch = useLaunchKitCampaign();
  const updateKit = useUpdateKit();
  const [step, setStep] = useState<SendKitStep>(0);
  const [sending, setSending] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState("");

  const catalog: UiProduct[] = useMemo(() => workspace?.catalogProducts ?? [], [workspace]);
  const contacts: UiContact[] = useMemo(() => workspace?.contacts ?? [], [workspace]);
  const kit = workspace?.kits.find((k) => k.id === id);

  const [kitName, setKitName] = useState("");

  useEffect(() => {
    if (kit) {
      setKitName(kit.name);
    }
  }, [kit]);

  const initial = useMemo(() => {
    const picked = kit ? kitPickedIndices(kit, catalog) : [];
    const packaging = kit?.packaging === "none" ? "none" : "box";
    const firstRecips = contacts.slice(0, 2).map((c) => c.id);
    return initialSendKitDraft(picked, packaging, firstRecips, workspace?.account ?? "Shelf Merch");
  }, [kit, catalog, contacts, workspace?.account]);

  const [draft, dispatch] = useReducer(sendKitReducer, initial);

  const checkoutWallets = useMemo(
    () => (workspace ? walletsForCheckout(workspace) : []),
    [workspace],
  );
  const wallet =
    checkoutWallets.find((w) => w.id === selectedWalletId) ?? checkoutWallets[0];
  const totals = kitSendTotals(draft.selRecips.length, draft.pkg);
  const surpriseMissing =
    draft.mode === "surprise" ? missingAddress(contacts, draft.selRecips) : [];

  function onNext() {
    if (step === 0) {
      if (kit && kitName.trim() && kitName !== kit.name) {
        updateKit.mutateAsync({
          id: kit.id,
          name: kitName.trim(),
          pickedIndices: kitPickedIndices(kit, catalog),
          catalog,
        }).catch((err) => {
          console.error("Failed to rename kit:", err);
        });
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!draft.selRecips.length) {
        toast.error("Select at least one recipient");
        return;
      }
      if (draft.mode === "surprise" && surpriseMissing.length) {
        toast.error("Complete the shipping address for all surprise recipients");
        return;
      }
      if (draft.mode === "single") {
        const l = draft.singleLocation;
        if (!l.name || !l.email.includes("@") || !l.line1 || !l.city || !l.state || !l.pincode) {
          toast.error("Enter the location contact, email, and complete shipping address");
          return;
        }
      }
      const isCurated = !!getCuratedKitMeta(kit);
      if (!isCurated && (draft.mode === "surprise" || draft.mode === "single")) {
        const missingList: string[] = [];
        const pickedProds = draft.picked.map((idx) => catalog[idx]).filter(Boolean);
        for (const rid of draft.selRecips) {
          const contact = contacts.find((c) => c.id === rid);
          const name = contact?.name || "Recipient";
          const variants = draft.recipVariants[rid] || {};
          for (const prod of pickedProds) {
            const ref = kit?.productRefs?.find((r) => r.catalogProductId === prod.id) ?? {};
            const opts = resolveKitItemOptions(prod, ref);
            const sel = variants[prod.id || ""] || {};
            if (opts.requiresSize && !sel.size) missingList.push(`${name}'s size for ${prod.nm}`);
            if (opts.requiresColor && !sel.color) missingList.push(`${name}'s color for ${prod.nm}`);
          }
        }
        if (missingList.length > 0) {
          toast.error(`Please select variants: missing ${missingList.slice(0, 3).join(", ")}${missingList.length > 3 ? ` and ${missingList.length - 3} more` : ""}`);
          return;
        }
      }
    }
    setStep((s) => Math.min(s + 1, 3) as SendKitStep);
  }

  async function resolveEntityId(walletId: string | undefined): Promise<string | undefined> {
    if (!walletId || !workspace) return undefined;

    const local = entityIdForWallet(workspace, walletId);
    if (local) return local;

    if (workspace.userPatch.role === "entity_manager") return undefined;

    return ensureSpendEntityForWalletApi(walletId);
  }

  async function onPayAndSend() {
    const walletId = selectedWalletId || checkoutWallets[0]?.id || workspace?.wallets[0]?.id;
    let entityId: string | undefined;
    try {
      entityId = await resolveEntityId(walletId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resolve wallet budget");
      return;
    }
    if (!entityId) {
      toast.error("No budget department found for this wallet — allocate funds first");
      return;
    }
    if (!draft.selRecips.length) {
      toast.error("Select at least one recipient");
      return;
    }
    const paymentTotal = Math.round(totals.total);
    if (draft.pay === "wallet") {
      const available = walletId && workspace ? spendableForWallet(workspace, walletId) : 0;
      const payWallet = walletId ? workspace?.wallets.find((w) => w.id === walletId) : undefined;
      if (available < paymentTotal) {
        toast.error(
          `Insufficient wallet balance — ${formatWalletAmount(available, payWallet?.cur)} available`,
        );
        return;
      }
    }
    setSending(true);
    try {
      if (kit && kit.status !== "live") {
        await updateKit.mutateAsync({
          id: kit.id,
          pickedIndices: kitPickedIndices(kit, catalog),
          catalog,
          status: "live",
        });
      }
      await launch.mutateAsync({
        entityId: String(entityId),
        kitId: String(kit!.id),
        name: kit!.name,
        totalBudget: paymentTotal,
        fulfillmentMode:
          draft.mode === "surprise" ? "surprise" : draft.mode === "single" ? "single" : "redeem",
        singleLocation: draft.mode === "single" ? draft.singleLocation : undefined,
        message: { from: draft.from, body: draft.msg },
        schedule: toSchedulePayload(draft.when, draft.schedule),
        contactIds: draft.selRecips,
        contacts: contacts.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
        })),
        recipVariants: draft.recipVariants,
      });
      await refreshWorkspace();
      toast.success(`Order placed for ${draft.selRecips.length} recipients! 📦`);
      navigate("/app/orders");
    } catch (err) {
      setSending(false);
      toast.error(err instanceof Error ? err.message : "Failed to send kit");
    }
  }

  return {
    isLoading: isLoading && !workspace,
    isSending: sending || launch.isPending,
    notFound: !isLoading && !!workspace && !kit,
    kit,
    account: workspace?.account,
    shopName: workspace?.shops[0]?.name,
    step,
    draft,
    dispatch,
    contacts,
    catalog,
    totals,
    surpriseMissing,
    wallet,
    wallets: checkoutWallets,
    selectedWalletId: selectedWalletId || checkoutWallets[0]?.id,
    onWalletSelect: setSelectedWalletId,
    walletAvailable: (w) => (workspace ? spendableForWallet(workspace, w.id) : 0),
    onExit: () => navigate("/app/kits"),
    onNext,
    onBack: () => setStep((s) => Math.max(s - 1, 0) as SendKitStep),
    onPayAndSend,
    kitName,
    setKitName,
  };
}
