import { useState, type CSSProperties } from "react";
import { Pencil } from "lucide-react";
import type { UiShop } from "@/services/mappers";
import {
  BANNER_IMAGE_DIMENSIONS,
  BANNER_THEMES,
  SHOP_BANNER_PRESETS,
  ShopBanner,
  bannerDisplayUrl,
} from "../banner";
import { BannerCustomUpload } from "../BannerCustomUpload";
import { useShopLookEditor } from "../useShopLookEditor";

export function ShopLayoutTab({ shop }: { shop: UiShop }) {
  const { state, setState, onPickLogo, onSave, previewSource, logoInputRef, isPending } =
    useShopLookEditor(shop);
  const [bannerOpen, setBannerOpen] = useState(false);

  const bannerThumb = bannerDisplayUrl({
    bannerPreset: state.preset,
    bannerImageUrl: state.imageUrl,
  });

  return (
    <div className="card shop-layout">
      <div className="shop-layout-head">
        <h3 className="shop-layout-title">Widgets</h3>
        <p className="shop-layout-sub muted">
          Customize logo and top banner for <b>{shop.name}</b>. Changes appear on your storefront
          preview.
        </p>
      </div>

      <div className="shop-layout-grid">
        <div className="shop-layout-controls">
          <div className="shop-layout-field">
            <div className="shop-layout-field-head">
              <span className="shop-layout-lbl">Logo</span>
              <span className="shop-layout-spec muted">SVG, PNG, WEBP, JPEG · max 5 MB</span>
            </div>
            <p className="shop-layout-hint muted">
              Upload a new logo from your device or replace the current one.
            </p>
            <div className="shop-layout-picker">
              <div className="shop-layout-picker-preview shop-layout-picker-preview--logo">
                {state.logoUrl ? (
                  <img src={state.logoUrl} alt="" className="shop-layout-logo-thumb" />
                ) : (
                  <span className="shop-layout-placeholder">No logo</span>
                )}
              </div>
              <button
                type="button"
                className="shop-layout-edit-btn"
                aria-label="Edit logo"
                onClick={() => logoInputRef.current?.click()}
              >
                <Pencil size={15} />
              </button>
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept=".svg,.png,.webp,.jpeg,.jpg,image/svg+xml,image/png,image/webp,image/jpeg"
              className="wallet-doc-file-inp"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickLogo(f);
                e.target.value = "";
              }}
            />
          </div>

          <div className="shop-layout-field">
            <div className="shop-layout-field-head">
              <span className="shop-layout-lbl">Top banner</span>
              <span className="shop-layout-spec muted">
                Library or custom · {BANNER_IMAGE_DIMENSIONS}
              </span>
            </div>
            <p className="shop-layout-hint muted">
              Browse our library, pick a solid colour, or upload your own banner image.
            </p>
            <div className="shop-layout-picker">
              <div className="shop-layout-picker-preview shop-layout-picker-preview--banner">
                {bannerThumb ? (
                  <img src={bannerThumb} alt="" className="shop-layout-banner-thumb" />
                ) : (
                  <div className="shop-layout-banner-solid" style={solidSwatchStyle(state.theme)} />
                )}
              </div>
              <button
                type="button"
                className="shop-layout-edit-btn"
                aria-label="Edit banner"
                onClick={() => setBannerOpen((o) => !o)}
              >
                <Pencil size={15} />
              </button>
            </div>

            {bannerOpen && (
              <div className="shop-layout-banner-panel">
                <BannerCustomUpload
                  compact
                  imageUrl={state.imageUrl}
                  onChange={(imageUrl) =>
                    setState((s) => ({
                      ...s,
                      imageUrl,
                      ...(imageUrl ? { preset: "" } : {}),
                    }))
                  }
                />
                <p className="shop-layout-panel-lbl" style={{ marginTop: 14 }}>
                  Banner library
                </p>
                <div className="shop-layout-presets">
                  {SHOP_BANNER_PRESETS.map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={`shop-layout-preset${!state.imageUrl && state.preset === id ? " on" : ""}`}
                      onClick={() => setState((s) => ({ ...s, preset: id, imageUrl: "" }))}
                    >
                      <img src={`/shop-banners/${id}.png`} alt="" loading="lazy" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                <p className="shop-layout-panel-lbl" style={{ marginTop: 14 }}>
                  Solid colour
                </p>
                <div className="shop-layout-swatches">
                  {Object.keys(BANNER_THEMES).map((k) => (
                    <button
                      key={k}
                      type="button"
                      className={`shop-layout-swatch${state.theme === k && !state.preset && !state.imageUrl ? " on" : ""}`}
                      onClick={() => setState((s) => ({ ...s, theme: k, preset: "", imageUrl: "" }))}
                    >
                      <span style={solidSwatchStyle(k)} />
                      <span>{k}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn btn-brand shop-layout-save"
            disabled={isPending}
            onClick={onSave}
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </div>

        <div className="shop-layout-preview-wrap">
          <p className="shop-layout-preview-lbl">Preview</p>
          <div className="shop-layout-preview">
            <div className="shop-layout-preview-logo">
              <span className="shop-layout-preview-tag">Logo</span>
              {state.logoUrl ? (
                <img src={state.logoUrl} alt="" />
              ) : (
                <div className="shop-layout-preview-logo-empty" />
              )}
            </div>
            <div className="shop-layout-preview-banner">
              <span className="shop-layout-preview-tag">Top banner</span>
              <ShopBanner
                source={{ ...previewSource, logoUrl: "" }}
                height={200}
                layout="center"
                logoSize={0}
                radius={0}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function solidSwatchStyle(themeKey: string): CSSProperties {
  const t = BANNER_THEMES[themeKey] || BANNER_THEMES.light;
  if (t.dots) {
    const bg = t.bg.startsWith("linear-gradient") ? t.bg : `linear-gradient(${t.bg},${t.bg})`;
    return {
      backgroundImage: `radial-gradient(rgba(255,255,255,.18) 1.4px,transparent 1.4px),${bg}`,
      backgroundSize: "14px 14px,auto",
    };
  }
  return { background: t.bg };
}
