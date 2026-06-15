import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  addVariant,
  createProduct,
  getPlatformProduct,
  listCategories,
  type PlatformProduct,
  type PrintArea,
  type ProductInput,
  type ProductVariant,
  publishProduct,
  setPrintAreas,
  updateProduct,
  uploadProductImages,
} from "@/services/platform-api";
import { PlatformError, PlatformPageHeader } from "./platform-ui";
import { PrintAreaEditor } from "./PrintAreaEditor";

const STEPS = ["Details", "Variants", "Images", "Print areas", "Review"] as const;

const emptyDetails: ProductInput = {
  name: "",
  category: "",
  sellingPriceInr: 0,
  costPriceInr: 0,
  brand: "",
  description: "",
  gstRate: 18,
  hsnCode: "",
  moq: 1,
  material: "",
  productionDays: 7,
};

const emptyVariant: ProductVariant = { size: "", color: "", sku: "", stock: 0 };

export function ProductWizard({ mode, productId }: { mode: "create" | "edit"; productId?: string }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [problems, setProblems] = useState<string[]>([]);

  const [id, setId] = useState<string | undefined>(productId);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [details, setDetails] = useState<ProductInput>(emptyDetails);
  const [variant, setVariant] = useState<ProductVariant>(emptyVariant);
  const [product, setProduct] = useState<PlatformProduct | null>(null);
  const [printAreas, setAreas] = useState<PrintArea[]>([]);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !productId) return;
    getPlatformProduct(productId)
      .then((p) => {
        setProduct(p);
        setAreas(p.printAreas ?? []);
        setDetails({
          name: p.name,
          category: p.category,
          sellingPriceInr: p.sellingPriceInr,
          costPriceInr: p.costPriceInr,
          brand: p.brand ?? "",
          description: p.description ?? "",
          gstRate: p.gstRate ?? 18,
          hsnCode: p.hsnCode ?? "",
          moq: p.moq ?? 1,
          material: p.material ?? "",
          productionDays: p.productionDays ?? 7,
        });
      })
      .catch((e) => setError(e.message));
  }, [mode, productId]);

  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) =>
    setDetails((d) => ({ ...d, [k]: v }));

  async function refresh() {
    if (!id) return;
    const p = await getPlatformProduct(id);
    setProduct(p);
    return p;
  }

  async function saveDetails() {
    setBusy(true);
    setError("");
    try {
      if (id) {
        await updateProduct(id, { ...details, reason: mode === "edit" ? "edit via wizard" : undefined });
        await refresh();
      } else {
        const created = await createProduct(details);
        setId(created._id);
        setProduct(created);
      }
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function addOneVariant() {
    if (!id || !variant.sku) return;
    setBusy(true);
    setError("");
    try {
      await addVariant(id, variant);
      setVariant(emptyVariant);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add variant");
    } finally {
      setBusy(false);
    }
  }

  async function uploadImages(files: FileList | null) {
    if (!id || !files?.length) return;
    setBusy(true);
    setError("");
    try {
      await uploadProductImages(id, Array.from(files), !product?.primaryImageUrl);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveAreas() {
    if (!id) return;
    setBusy(true);
    setError("");
    try {
      await setPrintAreas(id, printAreas);
      const p = await refresh();
      if (p?.printAreas) setAreas(p.printAreas);
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save print areas");
    } finally {
      setBusy(false);
    }
  }

  async function goToStep(i: number) {
    if (!id) return;
    if (i === 4 && step === 3 && printAreas.length) {
      setBusy(true);
      setError("");
      try {
        await setPrintAreas(id, printAreas);
        const p = await refresh();
        if (p?.printAreas) setAreas(p.printAreas);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save print areas");
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    setStep(i);
  }

  async function doPublish() {
    if (!id) return;
    setBusy(true);
    setError("");
    setProblems([]);
    try {
      if (printAreas.length) {
        await setPrintAreas(id, printAreas);
        await refresh();
      }
      await publishProduct(id);
      navigate({ to: "/platform/catalog" });
    } catch (e) {
      const body = (e as { details?: { error?: { details?: unknown } } }).details;
      const list = body?.error?.details;
      if (Array.isArray(list)) setProblems(list as string[]);
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PlatformPageHeader
        title={mode === "edit" ? "Edit product" : "New product"}
        subtitle="Define a base catalog product, its variants, images, and design placeholders."
        actions={
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate({ to: "/platform/catalog" })}>
            Back to catalog
          </button>
        }
      />

      <div className="row" style={{ gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {STEPS.map((label, i) => (
          <button
            type="button"
            key={label}
            className={`chip${i === step ? "" : ""}`}
            style={i === step ? { borderColor: "var(--brand)", color: "var(--brand-d)", fontWeight: 700 } : undefined}
            disabled={!id && i > 0}
            onClick={() => goToStep(i)}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {error && <PlatformError message={error} />}

      <div className="card" style={{ padding: 22, maxWidth: 880 }}>
        {step === 0 && (
          <>
            <div className="row" style={{ gap: 14 }}>
              <div className="field" style={{ flex: 2 }}>
                <label className="lbl">Product name</label>
                <input className="inp" value={details.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl">Category</label>
                <input
                  className="inp"
                  list="cat-list"
                  value={details.category}
                  onChange={(e) => set("category", e.target.value)}
                />
                <datalist id="cat-list">
                  {categories.map((c) => (
                    <option key={c._id} value={c.name} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="field">
              <label className="lbl">Description</label>
              <textarea className="inp" rows={2} value={details.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div className="row" style={{ gap: 14 }}>
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl">Selling price (₹)</label>
                <input className="inp" type="number" value={details.sellingPriceInr} onChange={(e) => set("sellingPriceInr", Number(e.target.value))} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl">Cost price (₹, internal)</label>
                <input className="inp" type="number" value={details.costPriceInr} onChange={(e) => set("costPriceInr", Number(e.target.value))} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl">GST %</label>
                <input className="inp" type="number" value={details.gstRate} onChange={(e) => set("gstRate", Number(e.target.value))} />
              </div>
            </div>
            <div className="row" style={{ gap: 14 }}>
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl">HSN code</label>
                <input className="inp" value={details.hsnCode} onChange={(e) => set("hsnCode", e.target.value)} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl">MOQ</label>
                <input className="inp" type="number" value={details.moq} onChange={(e) => set("moq", Number(e.target.value))} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl">Production days</label>
                <input className="inp" type="number" value={details.productionDays} onChange={(e) => set("productionDays", Number(e.target.value))} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl">Material</label>
                <input className="inp" value={details.material} onChange={(e) => set("material", e.target.value)} />
              </div>
            </div>
            <button type="button" className="btn btn-brand" disabled={busy || !details.name || !details.category || !details.sellingPriceInr} onClick={saveDetails}>
              {id ? "Save & continue" : "Create draft & continue"}
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h3 style={{ marginBottom: 12 }}>Variants</h3>
            {product?.variants?.length ? (
              <table className="tbl" style={{ marginBottom: 14 }}>
                <thead><tr><th>SKU</th><th>Size</th><th>Color</th><th>Stock</th></tr></thead>
                <tbody>
                  {product.variants.map((v) => (
                    <tr key={v.sku}><td>{v.sku}</td><td>{v.size || "—"}</td><td>{v.color || "—"}</td><td>{v.stock ?? 0}</td></tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted" style={{ marginBottom: 14 }}>No variants yet.</p>
            )}
            <div className="row" style={{ gap: 10, alignItems: "flex-end" }}>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}><label className="lbl">SKU</label><input className="inp" value={variant.sku} onChange={(e) => setVariant({ ...variant, sku: e.target.value })} /></div>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}><label className="lbl">Size</label><input className="inp" value={variant.size} onChange={(e) => setVariant({ ...variant, size: e.target.value })} /></div>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}><label className="lbl">Color</label><input className="inp" value={variant.color} onChange={(e) => setVariant({ ...variant, color: e.target.value })} /></div>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}><label className="lbl">Stock</label><input className="inp" type="number" value={variant.stock} onChange={(e) => setVariant({ ...variant, stock: Number(e.target.value) })} /></div>
              <button type="button" className="btn btn-soft" disabled={busy || !variant.sku} onClick={addOneVariant}>Add</button>
            </div>
            <div className="row" style={{ gap: 8, marginTop: 18 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>Back</button>
              <button type="button" className="btn btn-brand" onClick={() => setStep(2)}>Continue</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 style={{ marginBottom: 12 }}>Images</h3>
            <div className="row" style={{ flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
              {(product?.imageUrls ?? []).map((url) => (
                <img key={url} src={url} alt="" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 8, border: url === product?.primaryImageUrl ? "2px solid var(--brand)" : "1px solid var(--line)" }} />
              ))}
              {!product?.imageUrls?.length && <p className="muted">No images uploaded yet.</p>}
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
            <h3 style={{ marginBottom: 12 }}>Design placeholders</h3>
            <PrintAreaEditor images={product?.imageUrls ?? []} value={printAreas} onChange={setAreas} />
            <div className="row" style={{ gap: 8, marginTop: 18 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>Back</button>
              <button type="button" className="btn btn-brand" disabled={busy} onClick={saveAreas}>Save & continue</button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h3 style={{ marginBottom: 12 }}>Review &amp; publish</h3>
            <p className="muted" style={{ marginBottom: 6 }}>
              {product?.name} · {product?.sku} · {product?.variants?.length ?? 0} variants ·{" "}
              {product?.imageUrls?.length ?? 0} images · {printAreas.length} print areas
            </p>
            {problems.length > 0 && (
              <ul style={{ color: "var(--danger)", margin: "10px 0", paddingLeft: 18 }}>
                {problems.map((p) => <li key={p}>{p}</li>)}
              </ul>
            )}
            <div className="row" style={{ gap: 8, marginTop: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStep(3)}>Back</button>
              <button type="button" className="btn btn-brand" disabled={busy} onClick={doPublish}>Publish product</button>
              <button type="button" className="btn btn-soft" onClick={() => navigate({ to: "/platform/catalog" })}>Save as draft</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
