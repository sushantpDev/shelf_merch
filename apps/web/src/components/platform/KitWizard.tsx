import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  addKitItem,
  createKit,
  fetchPlatformProducts,
  getPlatformKit,
  getPlatformProduct,
  publishKit,
  removeKitItem,
  updateKit,
  uploadKitImages,
  type KitInput,
  type KitItem,
  type PlatformKit,
  type ProductVariant,
} from "@/services/platform-api";
import { inr, PlatformError, PlatformPageHeader } from "./platform-ui";

const STEPS = ["Details & rules", "Items", "Images", "Review"] as const;
const PACKAGING = ["none", "box", "premium_box"] as const;
const CAMPAIGN_TYPES = [
  "Employee onboarding",
  "Diwali gifting",
  "Event swag",
  "Uniform campaign",
  "Birthday gift",
  "Work anniversary",
  "Sales prospect gift",
  "Custom campaign",
];

const emptyDetails: KitInput = {
  name: "",
  description: "",
  packaging: "box",
  eligibleCampaignTypes: [],
  approxValueInr: 0,
  rules: { fixedComposition: true, customizationAllowed: true, minQtyPerRecipient: 1, maxQtyPerRecipient: 1 },
};

type ProductRow = { _id: string; name: string; sku: string };

export function KitWizard({ mode, kitId }: { mode: "create" | "edit"; kitId?: string }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [problems, setProblems] = useState<string[]>([]);

  const [id, setId] = useState<string | undefined>(kitId);
  const [details, setDetails] = useState<KitInput>(emptyDetails);
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
  const set = <K extends keyof KitInput>(k: K, v: KitInput[K]) => setDetails((d) => ({ ...d, [k]: v }));
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
      navigate({ to: "/platform/kits" });
    } catch (e) {
      const body = (e as { details?: { error?: { details?: unknown } } }).details;
      if (Array.isArray(body?.error?.details)) setProblems(body!.error!.details as string[]);
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  const rules = details.rules ?? emptyDetails.rules!;

  // Imported (e.g. Shopify) kits are curated, self-contained bundles — the item
  // composition flow does not apply; their contents are fixed as imported.
  const imported = !!kit?.source?.provider && kit.source.provider !== "manual";

  return (
    <>
      <PlatformPageHeader
        title={mode === "edit" ? "Edit kit" : "New kit"}
        subtitle="Curate a predefined gift kit from catalog products, with rules company admins must follow."
        actions={
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate({ to: "/platform/kits" })}>
            Back to kits
          </button>
        }
      />

      <div className="row" style={{ gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {STEPS.map((label, i) => (
          <button
            type="button"
            key={label}
            className="chip"
            style={i === step ? { borderColor: "var(--brand)", color: "var(--brand-d)", fontWeight: 700 } : undefined}
            disabled={!id && i > 0}
            onClick={() => id && setStep(i)}
          >
            {i + 1}. {imported && i === 1 ? "Bundle" : label}
          </button>
        ))}
      </div>

      {error && <PlatformError message={error} />}

      <div className="card" style={{ padding: 22, maxWidth: 860 }}>
        {step === 0 && (
          <>
            <div className="row" style={{ gap: 14 }}>
              <div className="field" style={{ flex: 2 }}>
                <label className="lbl">Kit name</label>
                <input className="inp" value={details.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl">Packaging</label>
                <select className="inp" value={details.packaging} onChange={(e) => set("packaging", e.target.value)}>
                  {PACKAGING.map((p) => (
                    <option key={p} value={p}>{p.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl">Approx value (₹)</label>
                <input className="inp" type="number" value={details.approxValueInr} onChange={(e) => set("approxValueInr", Number(e.target.value))} />
              </div>
            </div>
            <div className="field">
              <label className="lbl">Description</label>
              <textarea className="inp" rows={2} value={details.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div className="field">
              <label className="lbl">Eligible campaign types</label>
              <div className="row" style={{ flexWrap: "wrap", gap: 0 }}>
                {CAMPAIGN_TYPES.map((t) => {
                  const on = (details.eligibleCampaignTypes ?? []).includes(t);
                  return (
                    <button
                      type="button"
                      key={t}
                      className="chip"
                      style={on ? { borderColor: "var(--brand)", color: "var(--brand-d)" } : undefined}
                      onClick={() =>
                        set(
                          "eligibleCampaignTypes",
                          on
                            ? (details.eligibleCampaignTypes ?? []).filter((x) => x !== t)
                            : [...(details.eligibleCampaignTypes ?? []), t],
                        )
                      }
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="card" style={{ padding: 16, background: "var(--surface-2)" }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Rules</div>
              <label className="row" style={{ gap: 9, alignItems: "center", marginBottom: 10, fontSize: 13.5 }}>
                <input type="checkbox" checked={!!rules.fixedComposition} onChange={(e) => setRule("fixedComposition", e.target.checked)} />
                Fixed composition — tenants must use this kit as-is
              </label>
              <label className="row" style={{ gap: 9, alignItems: "center", marginBottom: 14, fontSize: 13.5 }}>
                <input type="checkbox" checked={!!rules.customizationAllowed} onChange={(e) => setRule("customizationAllowed", e.target.checked)} />
                Customization allowed — tenants may add their logo/branding
              </label>
              <div className="row" style={{ gap: 14 }}>
                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="lbl">Min qty / recipient</label>
                  <input className="inp" type="number" value={rules.minQtyPerRecipient} onChange={(e) => setRule("minQtyPerRecipient", Number(e.target.value))} />
                </div>
                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="lbl">Max qty / recipient</label>
                  <input className="inp" type="number" value={rules.maxQtyPerRecipient} onChange={(e) => setRule("maxQtyPerRecipient", Number(e.target.value))} />
                </div>
              </div>
            </div>
            <button type="button" className="btn btn-brand" style={{ marginTop: 18 }} disabled={busy || !details.name} onClick={saveDetails}>
              {id ? "Save & continue" : "Create draft & continue"}
            </button>
          </>
        )}

        {step === 1 && imported && (
          <>
            <h3 style={{ marginBottom: 12 }}>Curated bundle</h3>
            <div className="banner info" style={{ marginBottom: 14 }}>
              This kit was imported from {kit?.source?.provider === "shopify" ? "Shopify" : "an external source"} as a
              complete, pre-set bundle. Its contents are fixed — there are no individual products or variants to add here.
            </div>
            <p className="muted" style={{ marginBottom: 14 }}>
              {kit?.description || "No description provided."}
            </p>
            <div className="row" style={{ gap: 8, marginTop: 18 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>Back</button>
              <button type="button" className="btn btn-brand" onClick={() => setStep(2)}>Continue</button>
            </div>
          </>
        )}

        {step === 1 && !imported && (
          <>
            <h3 style={{ marginBottom: 12 }}>Kit items</h3>
            {kit?.items?.length ? (
              <table className="tbl" style={{ marginBottom: 14 }}>
                <thead><tr><th>Product</th><th>Variant</th><th>Qty</th><th></th></tr></thead>
                <tbody>
                  {kit.items.map((it) => (
                    <tr key={it._id}>
                      <td>{productName(it.catalogProductId)}</td>
                      <td className="muted">{it.variantSku || "—"}</td>
                      <td>{it.qty ?? 1}</td>
                      <td style={{ textAlign: "right" }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => dropItem(it._id)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted" style={{ marginBottom: 14 }}>No items yet. Add catalog products to this kit.</p>
            )}
            <div className="row" style={{ gap: 10, alignItems: "flex-end" }}>
              <div className="field" style={{ flex: 2, marginBottom: 0 }}>
                <label className="lbl">Product</label>
                <select className="inp" value={pickProductId} onChange={(e) => onPickProduct(e.target.value)}>
                  <option value="">Select a product…</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                <label className="lbl">Variant</label>
                <select className="inp" value={pickVariantSku} onChange={(e) => setPickVariantSku(e.target.value)} disabled={!pickVariants.length}>
                  <option value="">{pickVariants.length ? "Any" : "—"}</option>
                  {pickVariants.map((v) => (
                    <option key={v.sku} value={v.sku}>{[v.size, v.color].filter(Boolean).join(" / ") || v.sku}</option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ width: 90, marginBottom: 0 }}>
                <label className="lbl">Qty</label>
                <input className="inp" type="number" min={1} value={pickQty} onChange={(e) => setPickQty(Number(e.target.value))} />
              </div>
              <button type="button" className="btn btn-soft" disabled={busy || !pickProductId} onClick={addItem}>Add</button>
            </div>
            <div className="row" style={{ gap: 8, marginTop: 18 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>Back</button>
              <button type="button" className="btn btn-brand" onClick={() => setStep(2)}>Continue</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 style={{ marginBottom: 12 }}>Cover images (optional)</h3>
            <div className="row" style={{ flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
              {(kit?.imageUrls ?? []).map((url) => (
                <img key={url} src={url} alt="" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)" }} />
              ))}
              {!kit?.imageUrls?.length && <p className="muted">No images yet.</p>}
            </div>
            <input type="file" accept="image/*" multiple disabled={busy} onChange={(e) => uploadImages(e.target.files)} />
            <div className="row" style={{ gap: 8, marginTop: 18 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
              <button type="button" className="btn btn-brand" onClick={() => setStep(3)}>Continue</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3 style={{ marginBottom: 12 }}>Review &amp; publish</h3>
            <p className="muted" style={{ marginBottom: 6 }}>
              {kit?.name} · {imported ? "curated bundle" : `${kit?.items?.length ?? 0} items`} · approx {inr(kit?.approxValueInr ?? 0)} · packaging {kit?.packaging}
            </p>
            {problems.length > 0 && (
              <ul style={{ color: "var(--danger)", margin: "10px 0", paddingLeft: 18 }}>
                {problems.map((p) => <li key={p}>{p}</li>)}
              </ul>
            )}
            <div className="row" style={{ gap: 8, marginTop: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>Back</button>
              <button type="button" className="btn btn-brand" disabled={busy} onClick={doPublish}>Publish kit</button>
              <button type="button" className="btn btn-soft" onClick={() => navigate({ to: "/platform/kits" })}>Save as draft</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
