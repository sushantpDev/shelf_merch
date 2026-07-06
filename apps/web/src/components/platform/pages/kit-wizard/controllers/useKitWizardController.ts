import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  addKitItem,
  CAMPAIGN_TYPES,
  createKit,
  emptyKitDetails,
  fetchPlatformProducts,
  getPlatformKit,
  getPlatformProduct,
  KIT_WIZARD_STEPS,
  publishKit,
  removeKitItem,
  type KitInput,
  type KitItem,
  type PlatformKit,
  type ProductRow,
  type ProductVariant,
  updateKit,
  uploadKitImages,
} from "../model";

export type KitWizardVm = ReturnType<typeof useKitWizardController>;

/** Controller for the platform kit create/edit wizard. */
export function useKitWizardController(mode: "create" | "edit", kitId?: string) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [problems, setProblems] = useState<string[]>([]);

  const [id, setId] = useState<string | undefined>(kitId);
  const [details, setDetails] = useState<KitInput>(emptyKitDetails);
  const [kit, setKit] = useState<PlatformKit | null>(null);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [pickProductId, setPickProductId] = useState("");
  const [pickVariants, setPickVariants] = useState<ProductVariant[]>([]);
  const [pickVariantSku, setPickVariantSku] = useState("");
  const [pickQty, setPickQty] = useState(1);

  useEffect(() => {
    fetchPlatformProducts({ status: "active", limit: 200 })
      .then((res) => setProducts(res.items as ProductRow[]))
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !kitId) return;
    getPlatformKit(kitId)
      .then((k) => {
        setKit(k);
        setDetails({
          name: k.name,
          description: k.description ?? "",
          packaging: k.packaging,
          eligibleCampaignTypes: k.eligibleCampaignTypes ?? [],
          approxValueInr: k.approxValueInr ?? 0,
          rules: k.rules,
        });
      })
      .catch((e) => setError(e.message));
  }, [mode, kitId]);

  const productName = (pid: string) => products.find((p) => p._id === pid)?.name ?? pid;
  const set = <K extends keyof KitInput>(k: K, v: KitInput[K]) =>
    setDetails((d) => ({ ...d, [k]: v }));
  const setRule = (k: keyof NonNullable<KitInput["rules"]>, v: boolean | number) =>
    setDetails((d) => ({ ...d, rules: { ...d.rules, [k]: v } }));

  async function refresh() {
    if (!id) return;
    setKit(await getPlatformKit(id));
  }

  async function saveDetails() {
    setBusy(true);
    setError("");
    try {
      if (id) {
        await updateKit(id, details);
        await refresh();
      } else {
        const created = await createKit(details);
        setId(created._id);
        setKit(created);
      }
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function onPickProduct(pid: string) {
    setPickProductId(pid);
    setPickVariantSku("");
    setPickVariants([]);
    if (!pid) return;
    try {
      const full = await getPlatformProduct(pid);
      setPickVariants(full.variants ?? []);
    } catch {
      setPickVariants([]);
    }
  }

  async function addItem() {
    if (!id || !pickProductId) return;
    setBusy(true);
    setError("");
    try {
      const item: KitItem = { catalogProductId: pickProductId, variantSku: pickVariantSku, qty: pickQty };
      await addKitItem(id, item);
      setPickProductId("");
      setPickVariants([]);
      setPickVariantSku("");
      setPickQty(1);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add item");
    } finally {
      setBusy(false);
    }
  }

  async function dropItem(itemId?: string) {
    if (!id || !itemId) return;
    await removeKitItem(id, itemId);
    await refresh();
  }

  async function uploadImages(files: FileList | null) {
    if (!id || !files?.length) return;
    setBusy(true);
    setError("");
    try {
      await uploadKitImages(id, Array.from(files));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function doPublish() {
    if (!id) return;
    setBusy(true);
    setError("");
    setProblems([]);
    try {
      await publishKit(id);
      navigate("/platform/kits");
    } catch (e) {
      const body = (e as { details?: { error?: { details?: unknown } } }).details;
      if (Array.isArray(body?.error?.details)) setProblems(body!.error!.details as string[]);
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  const rules = details.rules ?? emptyKitDetails.rules!;
  const imported = !!kit?.source?.provider && kit.source.provider !== "manual";

  return {
    mode,
    steps: KIT_WIZARD_STEPS,
    campaignTypes: CAMPAIGN_TYPES,
    step,
    busy,
    error,
    problems,
    id,
    details,
    kit,
    products,
    pickProductId,
    pickVariants,
    pickVariantSku,
    pickQty,
    rules,
    imported,
    productName,
    onBack: () => navigate("/platform/kits"),
    onStep: setStep,
    onSet: set,
    onSetRule: setRule,
    onSaveDetails: saveDetails,
    onPickProduct,
    onPickVariantSku: setPickVariantSku,
    onPickQty: setPickQty,
    onAddItem: addItem,
    onDropItem: dropItem,
    onUploadImages: uploadImages,
    onPublish: doPublish,
    onSaveDraft: () => navigate("/platform/kits"),
  };
}
