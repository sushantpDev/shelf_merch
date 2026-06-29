import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  addVariant,
  createProduct,
  getPlatformProduct,
  type PlatformProduct,
  type PrintArea,
  type ProductInput,
  type ProductVariant,
  publishProduct,
  setPrintAreas,
  updateProduct,
  uploadProductImage,
} from "@/services/platform-api";
import { PlatformError, PlatformPageHeader } from "./platform-ui";
import { PrintAreaEditor } from "./PrintAreaEditor";
import { TintedGarment } from "../store/TintedGarment";
import { isPlaceholderColorHex, resolveColorHex } from "@/lib/colorMap";
import { resolveMediaUrl } from "@/lib/mediaUrl";

const STEPS = ["Details", "Variants", "Images", "Print areas", "Review"] as const;
const MANUAL_CATEGORIES = [
  "Apparel",
  "Bags",
  "Drinkware",
  "Health & Wellness",
  "Office",
  "Technology",
] as const;

const emptyDetails: ProductInput = {
  name: "",
  category: "",
  sellingPriceInr: 0,
  costPriceInr: 0,
  brand: "",
  description: "",
  keyFeatures: "",
  sizeGuide: "",
  gstRate: 18,
  hsnCode: "",
  moq: 1,
  material: "",
  productionDays: 7,
};

const emptyVariant: ProductVariant = { size: "", color: "", colorHex: "#ffffff", sku: "", stock: 0 };

function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 16V4M8 8l4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </svg>
  );
}

function MasterImageUpload({
  label,
  hint,
  accept,
  imageUrl,
  tintHex,
  disabled,
  onFile,
}: {
  label: string;
  hint: string;
  accept: string;
  imageUrl?: string;
  tintHex?: string;
  disabled?: boolean;
  onFile: (file: File | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [hover, setHover] = useState(false);
  const [fileName, setFileName] = useState("");

  const pick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setFileName(file.name);
    onFile(file);
  };

  return (
    <div style={{ flex: "1 1 200px", maxWidth: 220 }}>
      <label className="lbl">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        style={{ display: "none" }}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={pick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        style={{
          display: "block",
          width: "100%",
          padding: 0,
          border: `1.5px dashed ${dragOver ? "var(--brand)" : imageUrl ? "var(--line)" : "var(--line)"}`,
          borderRadius: 10,
          background: dragOver ? "var(--brand-50)" : "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "left",
          overflow: "hidden",
          boxShadow: dragOver ? "0 0 0 2px var(--brand-50)" : undefined,
        }}
      >
        <div style={{ width: "100%", height: 168, background: "var(--surface-2)", position: "relative", display: "grid", placeItems: "center" }}>
          {imageUrl ? (
            <div style={{ width: "100%", height: "100%" }}>
              <TintedGarment src={imageUrl} hex={tintHex} />
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "var(--ink-3)", padding: "0 16px" }}>
              <div style={{ color: "var(--brand)", display: "grid", placeItems: "center", marginBottom: 8 }}>
                <UploadIcon />
              </div>
              <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink-2)" }}>Upload image</div>
              <div style={{ fontSize: 11.5, marginTop: 4, lineHeight: 1.45 }}>Click or drag &amp; drop</div>
            </div>
          )}
          {imageUrl && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.45)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                opacity: disabled ? 0.6 : hover ? 1 : 0,
                transition: "opacity 0.15s",
                fontSize: 12,
                fontWeight: 600,
                gap: 6,
              }}
              className="master-upload-replace"
            >
              <UploadIcon />
              Replace image
            </div>
          )}
        </div>
        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--line)", background: "#fff" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>
            {imageUrl ? "Change file" : "Choose file"}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.4 }}>{hint}</div>
          {fileName && <div style={{ fontSize: 11, color: "var(--brand-d)", marginTop: 4, wordBreak: "break-all" }}>{fileName}</div>}
        </div>
      </button>
    </div>
  );
}

function MarketingImageCard({ imageUrl }: { imageUrl?: string }) {
  return (
    <div style={{ flex: "1 1 200px", maxWidth: 220 }}>
      <label className="lbl">Shopify marketing image</label>
      <div style={{ overflow: "hidden", border: "1px solid var(--line)", borderRadius: 10, background: "#fff" }}>
        <div style={{ width: "100%", height: 168, background: "var(--surface-2)", display: "grid", placeItems: "center" }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Shopify product"
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          ) : (
            <div className="muted" style={{ padding: 16, textAlign: "center", fontSize: 12, lineHeight: 1.5 }}>
              No Shopify product image was imported.
            </div>
          )}
        </div>
        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--line)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>Marketing only</div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.4 }}>
            Read-only Shopify image · not used for artwork or production
          </div>
        </div>
      </div>
    </div>
  );
}

async function pngHasTransparency(file: File) {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return false;
    context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 255) return true;
    }
    return false;
  } finally {
    bitmap.close();
  }
}

export function ProductWizard({ mode, productId }: { mode: "create" | "edit"; productId?: string }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [problems, setProblems] = useState<string[]>([]);

  const [id, setId] = useState<string | undefined>(productId);
  const [details, setDetails] = useState<ProductInput>(emptyDetails);
  const [variant, setVariant] = useState<ProductVariant>(emptyVariant);
  const [product, setProduct] = useState<PlatformProduct | null>(null);
  const [printAreas, setAreas] = useState<PrintArea[]>([]);
  const [previewColor, setPreviewColor] = useState<string>("");
  const categoryOptions = useMemo(
    () =>
      Array.from(new Set([
        ...MANUAL_CATEGORIES,
        ...(details.category ? [details.category] : []),
      ])).sort((a, b) => a.localeCompare(b)),
    [details.category],
  );

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
          keyFeatures: p.keyFeatures ?? "",
          sizeGuide: p.sizeGuide ?? "",
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

  // Distinct variant colours that drive the mask recolour preview. Accepts a
  // colour name, a stored hex, or both — hex-only variants still preview.
  const colorSwatches = useMemo(() => {
    const seen = new Map<string, { name: string; hex: string }>();
    for (const v of product?.variants ?? []) {
      const name = (v.color || "").trim();
      const hex = resolveColorHex(name, v.colorHex);
      if (!name && isPlaceholderColorHex(v.colorHex)) continue;
      const key = (name || hex).toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.set(key, { name: name || hex, hex });
    }
    return [...seen.values()];
  }, [product?.variants]);

  useEffect(() => {
    if (step !== 2 || !id) return;
    refresh().catch((e) => setError(e instanceof Error ? e.message : "Failed to load variants"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, id]);

  useEffect(() => {
    if (!colorSwatches.length) {
      setPreviewColor("");
      return;
    }
    setPreviewColor((cur) =>
      colorSwatches.some((c) => c.name === cur) ? cur : colorSwatches[0].name,
    );
  }, [colorSwatches]);

  const activeSwatch =
    colorSwatches.find((c) => c.name === previewColor) ?? colorSwatches[0];
  // First defined colour swatch — used to preview the mask tint in the wizard.
  const firstHex = activeSwatch?.hex;
  const legacyShopifyImageInMask =
    product?.source?.provider === "shopify"
    && !product.primaryImageUrl
    && !product.imageUrls?.length
    && /^https?:\/\//i.test(product.maskImageUrl || "");
  const marketingImageUrl = useMemo(() => {
    const raw =
      product?.primaryImageUrl
      || product?.imageUrls?.[0]
      || (legacyShopifyImageInMask ? product?.maskImageUrl : undefined);
    return raw ? resolveMediaUrl(raw) : undefined;
  }, [legacyShopifyImageInMask, product?.primaryImageUrl, product?.imageUrls, product?.maskImageUrl]);
  const productionMaskImageUrl =
    product?.maskImageUrl && !legacyShopifyImageInMask
      ? product.maskImageUrl
      : undefined;

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
    const color = (variant.color ?? "").trim() || variant.colorHex || "";
    const colorHex = variant.colorHex || resolveColorHex(color);
    setBusy(true);
    setError("");
    try {
      await addVariant(id, { ...variant, color, colorHex });
      setVariant(emptyVariant);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add variant");
    } finally {
      setBusy(false);
    }
  }

  async function uploadMask(file: File | undefined) {
    if (!id || !file) return;
    const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
    if (!isPng) {
      setError("Design mask must be a PNG file.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (!(await pngHasTransparency(file))) {
        setError("Design mask must contain transparent pixels. Please upload a transparent PNG.");
        return;
      }
      await uploadProductImage(id, file, "mask");
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
    if (i === 2) {
      setBusy(true);
      setError("");
      try {
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load variants");
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
      // Persist the latest manual category/details selection before publishing.
      await updateProduct(id, { ...details, reason: "save details before publish" });
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
                <select
                  className="inp"
                  value={details.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  <option value="" disabled>Select a category</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label className="lbl">Description</label>
              <textarea className="inp" rows={4} value={details.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div className="field">
              <label className="lbl">Key features</label>
              <textarea className="inp" rows={4} value={details.keyFeatures} onChange={(e) => set("keyFeatures", e.target.value)} />
            </div>
            <div className="field">
              <label className="lbl">Size guide</label>
              <textarea className="inp" rows={4} value={details.sizeGuide} onChange={(e) => set("sizeGuide", e.target.value)} />
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
                  {product.variants.map((v) => {
                    const hex = resolveColorHex(v.color, v.colorHex);
                    return (
                      <tr key={v.sku}>
                        <td>{v.sku}</td>
                        <td>{v.size || "—"}</td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            {!isPlaceholderColorHex(hex) && (
                              <span
                                title={hex}
                                style={{ width: 14, height: 14, borderRadius: 4, border: "1px solid var(--line)", background: hex }}
                              />
                            )}
                            {v.color || "—"}
                          </span>
                        </td>
                        <td>{v.stock ?? 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="muted" style={{ marginBottom: 14 }}>No variants yet.</p>
            )}
            <div className="row" style={{ gap: 10, alignItems: "flex-end" }}>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}><label className="lbl">SKU</label><input className="inp" value={variant.sku} onChange={(e) => setVariant({ ...variant, sku: e.target.value })} /></div>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}><label className="lbl">Size</label><input className="inp" value={variant.size} onChange={(e) => setVariant({ ...variant, size: e.target.value })} /></div>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}><label className="lbl">Color</label><input className="inp" value={variant.color} onChange={(e) => setVariant({ ...variant, color: e.target.value })} /></div>
              <div className="field" style={{ marginBottom: 0 }}><label className="lbl">Hex</label><input type="color" value={variant.colorHex || "#ffffff"} onChange={(e) => setVariant({ ...variant, colorHex: e.target.value })} style={{ width: 44, height: 38, padding: 2, border: "1px solid var(--line)", borderRadius: 8, background: "#fff" }} /></div>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}><label className="lbl">Stock</label><input className="inp" type="number" value={variant.stock} onChange={(e) => setVariant({ ...variant, stock: Number(e.target.value) })} /></div>
              <button type="button" className="btn btn-soft" disabled={busy || !variant.sku} onClick={addOneVariant}>Add</button>
            </div>
            <div className="row" style={{ gap: 8, marginTop: 18 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>Back</button>
              <button
                type="button"
                className="btn btn-brand"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    await refresh();
                    setStep(2);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Failed to load variants");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 style={{ marginBottom: 4 }}>Product images</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
              Marketing and production imagery are kept separate. Only the transparent design mask is used for artwork placement.
            </p>
            <div className="row" style={{ gap: 18, flexWrap: "wrap", marginBottom: 22, alignItems: "flex-start" }}>
              <MarketingImageCard imageUrl={marketingImageUrl} />
              <MasterImageUpload
                label="Design & production mask"
                hint="Transparent PNG · used for artwork, print areas and production"
                accept="image/png"
                imageUrl={productionMaskImageUrl ? resolveMediaUrl(productionMaskImageUrl) : undefined}
                tintHex={firstHex}
                disabled={busy || !id}
                onFile={uploadMask}
              />
            </div>

            {!id && (
              <p className="muted" style={{ fontSize: 12, marginTop: -8, marginBottom: 12 }}>
                Save product details on step 1 before uploading images.
              </p>
            )}


            {productionMaskImageUrl && (
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ marginBottom: 2 }}>Colour preview</h3>
                <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
                  The single mask recolours to each variant colour automatically. Pick a colour to inspect the runtime tint.
                </p>
                {colorSwatches.length === 0 ? (
                  <p className="muted">Add variants with colours to preview the recoloured mask.</p>
                ) : (
                  <div className="row" style={{ gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ width: 200, height: 200, borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface-2)", overflow: "hidden" }}>
                        <TintedGarment src={resolveMediaUrl(productionMaskImageUrl)} hex={activeSwatch?.hex} />
                      </div>
                      {activeSwatch && (
                        <div className="row" style={{ gap: 8, alignItems: "center", marginTop: 8 }}>
                          <span style={{ width: 16, height: 16, borderRadius: "50%", border: "1px solid var(--line)", background: activeSwatch.hex }} />
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{activeSwatch.name}</span>
                          <span className="muted" style={{ fontSize: 12, fontFamily: "monospace" }}>{activeSwatch.hex}</span>
                        </div>
                      )}
                    </div>
                    <div className="row" style={{ gap: 10, flexWrap: "wrap", flex: 1 }}>
                      {colorSwatches.map((c) => {
                        const selected = c.name === activeSwatch?.name;
                        return (
                          <button
                            type="button"
                            key={c.name}
                            onClick={() => setPreviewColor(c.name)}
                            title={`${c.name} · ${c.hex}`}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 6,
                              padding: 6,
                              borderRadius: 8,
                              cursor: "pointer",
                              background: selected ? "var(--surface-2)" : "transparent",
                              border: selected ? "2px solid var(--brand)" : "1px solid var(--line)",
                            }}
                          >
                            <div style={{ width: 64, height: 64, borderRadius: 6, overflow: "hidden", background: "var(--surface-2)" }}>
                              <TintedGarment src={resolveMediaUrl(productionMaskImageUrl)} hex={c.hex} />
                            </div>
                            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, maxWidth: 72 }}>
                              <span style={{ width: 10, height: 10, borderRadius: "50%", border: "1px solid var(--line)", background: c.hex, flexShrink: 0 }} />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="row" style={{ gap: 8, marginTop: 18 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
              <button type="button" className="btn btn-brand" onClick={() => setStep(3)}>Continue</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3 style={{ marginBottom: 12 }}>Design placeholders</h3>
            <PrintAreaEditor
              images={[productionMaskImageUrl].filter(Boolean) as string[]}
              maskImageUrl={productionMaskImageUrl}
              colors={colorSwatches}
              value={printAreas}
              onChange={setAreas}
            />
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
              {marketingImageUrl ? "Shopify marketing image" : "no marketing image"} ·{" "}
              {productionMaskImageUrl ? "production mask" : "no production mask"} · {printAreas.length} print areas
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
