import { useReducer, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";
import { FullscreenOverlay } from "@/components/tenant/FullscreenOverlay";
import { bannerConfigFromSource } from "./banner";
import { useCreateShop } from "./hooks";
import { ShopBuilderStep } from "./ShopBuilderStep";
import { DEFAULT_BUILDER_CATEGORIES, SHOP_CURRENCIES } from "./types";

const LOGO_ACCEPT = /\.(svg|png|webp|jpe?g)$/i;
const LOGO_MAX = 5 * 1024 * 1024;

export type ShopDraft = {
  step: 0 | 1 | 2;
  name: string;
  currency: string;
  logoUrl: string;
  categories: string[];
  bannerTheme: string;
  bannerPreset: string;
};

const INITIAL: ShopDraft = {
  step: 0,
  name: "",
  currency: "Points",
  logoUrl: "",
  categories: DEFAULT_BUILDER_CATEGORIES,
  bannerTheme: "light",
  bannerPreset: "",
};

export type ShopDraftAction =
  | { type: "set"; patch: Partial<ShopDraft> }
  | { type: "toggleCategory"; category: string };

function reducer(state: ShopDraft, action: ShopDraftAction): ShopDraft {
  if (action.type === "toggleCategory") {
    const has = state.categories.includes(action.category);
    return {
      ...state,
      categories: has
        ? state.categories.filter((c) => c !== action.category)
        : [...state.categories, action.category],
    };
  }
  return { ...state, ...action.patch };
}

export function CreateShopWizard() {
  const navigate = useNavigate();
  const createShop = useCreateShop();
  const [draft, dispatch] = useReducer(reducer, INITIAL);
  const fileRef = useRef<HTMLInputElement>(null);

  function exit() {
    navigate({ to: "/app/shops" });
  }

  function next() {
    if (!draft.name.trim()) {
      toast.error("Enter a shop name");
      return;
    }
    dispatch({ type: "set", patch: { step: 1 } });
  }

  function onPickLogo(file: File) {
    if (!LOGO_ACCEPT.test(file.name)) {
      toast.error("Accepted formats: SVG, PNG, WEBP, JPEG, JPG");
      return;
    }
    if (file.size > LOGO_MAX) {
      toast.error("File must be 5 MB or smaller");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => dispatch({ type: "set", patch: { logoUrl: String(reader.result) } });
    reader.readAsDataURL(file);
  }

  async function publish() {
    const name = draft.name.trim();
    if (!name) {
      toast.error("Enter a shop name");
      dispatch({ type: "set", patch: { step: 0 } });
      return;
    }
    try {
      const shop = await createShop.mutateAsync({
        name,
        currency: draft.currency,
        categories: draft.categories,
        logoUrl: draft.logoUrl,
        bannerConfig: bannerConfigFromSource({
          bannerTheme: draft.bannerTheme,
          bannerPreset: draft.bannerPreset,
        }),
      });
      toast.success(`"${shop.name}" shop published successfully!`);
      navigate({ to: "/app/shops/$id", params: { id: shop.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish shop");
    }
  }

  if (draft.step === 2) {
    return (
      <ShopBuilderStep
        draft={draft}
        dispatch={dispatch}
        onExit={exit}
        onPublish={publish}
        publishing={createShop.isPending}
      />
    );
  }

  return (
    <FullscreenOverlay style={{ background: "#0E1E16" }}>
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 24 }}>
        <div
          className="card"
          style={{
            width: "100%",
            maxWidth: 980,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            overflow: "hidden",
            boxShadow: "var(--sh-3)",
          }}
        >
          <div
            style={{
              padding: "48px 40px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <h1 style={{ fontSize: 40, color: "var(--brand)", lineHeight: 1.05 }}>
              Let&apos;s create
              <br />
              your shop
            </h1>
            <p className="muted" style={{ marginTop: 20, maxWidth: "34ch", lineHeight: 1.55 }}>
              Create a shop for gifting recipients and beyond. Total control over branding, banner
              and products.
            </p>
          </div>
          <div
            style={{
              padding: "40px 38px",
              background: "var(--surface-2)",
              borderLeft: "1px solid var(--line)",
            }}
          >
            {draft.step === 0 ? (
              <>
                <h3 style={{ fontSize: 19, marginBottom: 16 }}>Shop details</h3>
                <div className="field">
                  <label className="lbl" htmlFor="sh-name">
                    Shop name *
                  </label>
                  <input
                    id="sh-name"
                    className="inp"
                    value={draft.name}
                    placeholder="Enter shop name"
                    autoFocus
                    onChange={(e) => dispatch({ type: "set", patch: { name: e.target.value } })}
                  />
                </div>
                <div className="lbl">Choose currency</div>
                {SHOP_CURRENCIES.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    className={`optcard ${draft.currency === c.key ? "on" : ""}`}
                    style={{ marginBottom: 10, width: "100%", textAlign: "left" }}
                    aria-pressed={draft.currency === c.key}
                    onClick={() => dispatch({ type: "set", patch: { currency: c.key } })}
                  >
                    <div className="rd" />
                    <div>
                      <h4>{c.title}</h4>
                      <p>{c.desc}</p>
                    </div>
                  </button>
                ))}
                <p
                  className="mut3"
                  style={{ fontSize: 11.5, margin: "6px 0 16px", lineHeight: 1.5 }}
                >
                  Currency &amp; shop name can be edited from your dashboard. Currency can&apos;t
                  change once an order starts.
                </p>
                <button type="button" className="btn btn-dark btn-block btn-lg" onClick={next}>
                  Next
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="lnk"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 12,
                  }}
                  onClick={() => dispatch({ type: "set", patch: { step: 0 } })}
                >
                  <ArrowLeft size={15} /> Back
                </button>
                <h3 style={{ fontSize: 22, fontFamily: "var(--disp)" }}>Add your logo</h3>
                <p className="muted" style={{ fontSize: 13, margin: "4px 0 12px" }}>
                  We&apos;ll use your logo to generate assets for your shop.
                </p>
                {draft.logoUrl ? (
                  <div
                    className="row"
                    style={{
                      alignItems: "center",
                      justifyContent: "space-between",
                      border: "1px solid var(--brand)",
                      borderRadius: "var(--r-sm)",
                      padding: "12px 14px",
                      background: "var(--brand-50)",
                    }}
                  >
                    <div
                      className="logo-chip"
                      style={{ width: 38, height: 38, overflow: "hidden", padding: 4 }}
                    >
                      <img
                        src={draft.logoUrl}
                        alt="Shop logo"
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                      />
                    </div>
                    <button
                      type="button"
                      className="xbtn"
                      aria-label="Remove logo"
                      onClick={() => dispatch({ type: "set", patch: { logoUrl: "" } })}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    style={{
                      width: "100%",
                      border: "1.5px dashed var(--line)",
                      borderRadius: "var(--r)",
                      padding: 30,
                      textAlign: "center",
                      color: "var(--ink-2)",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload size={22} color="#15784C" />
                    <div style={{ fontWeight: 600, marginTop: 8 }}>Drag and drop file</div>
                    <div className="mut3" style={{ fontSize: 11.5, margin: "8px 0 4px" }}>
                      Accepted: SVG, PNG, WEBP, JPEG, JPG · Max 5 MB
                    </div>
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".svg,.png,.webp,.jpeg,.jpg,image/svg+xml,image/png,image/webp,image/jpeg"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPickLogo(f);
                    e.target.value = "";
                  }}
                />
                <div className="row" style={{ marginTop: 18 }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-block"
                    onClick={() => dispatch({ type: "set", patch: { step: 2 } })}
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    className="btn btn-dark btn-block"
                    onClick={() => dispatch({ type: "set", patch: { step: 2 } })}
                  >
                    Create shop
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </FullscreenOverlay>
  );
}
