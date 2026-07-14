import { type Dispatch, useState } from "react";
import { Check, SquarePen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FullscreenOverlay } from "@/components/tenant/FullscreenOverlay";
import {
  BANNER_THEMES,
  SHOP_BANNER_PRESETS,
  bannerBackgroundStyle,
  bannerDisplayUrl,
  type BannerSource,
} from "./banner";
import { BannerCustomUpload } from "./BannerCustomUpload";
import type { ShopDraft, ShopDraftAction } from "./shopDraft";
import { BUILDER_CATEGORIES } from "./types";

export function ShopBuilderStep({
  draft,
  dispatch,
  onExit,
  onPublish,
  publishing,
}: {
  draft: ShopDraft;
  dispatch: Dispatch<ShopDraftAction>;
  onExit: () => void;
  onPublish: () => void;
  publishing: boolean;
}) {
  const [bannerOpen, setBannerOpen] = useState(false);
  const source: BannerSource = {
    bannerTheme: draft.bannerTheme,
    bannerPreset: draft.bannerPreset,
    bannerImageUrl: draft.bannerImageUrl,
    logoUrl: draft.logoUrl,
  };
  const theme = BANNER_THEMES[draft.bannerTheme] || BANNER_THEMES.light;
  const imageUrl = bannerDisplayUrl(source);
  const hasImage = Boolean(imageUrl);
  const isEmptyBanner = !hasImage && !draft.logoUrl;

  return (
    <FullscreenOverlay style={{ background: "var(--bg)" }}>
      <div
        style={{
          height: 60,
          background: "var(--ink)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 22px",
          flex: "none",
        }}
      >
        <button
          type="button"
          className="lnk"
          style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}
          onClick={onExit}
        >
          Exit
        </button>
        <span
          style={{ fontFamily: "var(--disp)", fontWeight: 800, fontSize: 18, fontStyle: "italic" }}
        >
          Shelf Merch
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={publishing}
          onClick={onPublish}
        >
          {publishing ? "Publishing…" : "Save & publish"}
        </button>
      </div>

      <div className="scroll" style={{ flex: 1 }}>
        <div
          className={`shop-builder-banner${hasImage || isEmptyBanner ? " has-preset" : ""}${isEmptyBanner ? " is-empty" : ""}`}
        >
          {hasImage ? (
            <img src={imageUrl} alt="" className="shop-builder-banner-img" />
          ) : isEmptyBanner ? (
            <img
              src="/shop-banners/default-welcome.png"
              alt=""
              className="shop-builder-banner-img"
            />
          ) : (
            <div
              className={`shop-builder-banner-solid${theme.dots ? " shopbanner-merch" : ""}`}
              style={bannerBackgroundStyle(source)}
              aria-hidden
            />
          )}

          <div className="shop-builder-banner-content">
            {draft.logoUrl ? (
              <div className={`shop-builder-banner-logo${hasImage || isEmptyBanner ? " corner" : ""}`}>
                <img src={draft.logoUrl} alt="Shop logo" />
              </div>
            ) : null}

            {!hasImage && !isEmptyBanner ? (
              <div className="shop-builder-banner-title" style={{ color: theme.text }}>
                {draft.name || "Your shop name"}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="shop-builder-banner-edit-center"
            onClick={() => setBannerOpen(true)}
          >
            <SquarePen size={15} strokeWidth={2} />
            Edit banner
          </button>
        </div>

        <div className="shop-builder-body fade-in">
          <div className="shop-builder-panel">
            <h2 className="shop-builder-panel-title">Choose categories for your shop</h2>
            <p className="shop-builder-panel-desc muted">
              Pick categories for recipients to shop from. After saving, you can enable/disable
              individual products.
            </p>
            <div className="shop-builder-cats">
              {BUILDER_CATEGORIES.map(([category, , thumb]) => {
                const selected = draft.categories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    className={`optcard shop-builder-cat ${selected ? "on" : ""}`}
                    aria-pressed={selected}
                    onClick={() => dispatch({ type: "toggleCategory", category })}
                  >
                    <div
                      className="shop-builder-cat-check"
                      style={{
                        borderColor: selected ? "var(--brand)" : "var(--line-strong)",
                        background: selected ? "var(--brand)" : "#fff",
                      }}
                    >
                      {selected ? <Check size={12} color="#fff" /> : null}
                    </div>
                    <div className="shop-builder-cat-label">
                      <h4>{category}</h4>
                    </div>
                    <div className="shop-builder-cat-thumb">
                      <img src={thumb} alt="" width={48} height={48} loading="lazy" decoding="async" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={bannerOpen} onOpenChange={setBannerOpen}>
        <DialogContent className="sm-modal">
          <div className="modal-pad">
            <DialogHeader>
              <DialogTitle>Edit banner</DialogTitle>
            </DialogHeader>
            <p className="muted" style={{ fontSize: 13, margin: "6px 0 12px" }}>
              Choose a library banner, solid pattern, or upload your own image.
            </p>

            <BannerCustomUpload
              imageUrl={draft.bannerImageUrl}
              onChange={(bannerImageUrl) =>
                dispatch({
                  type: "set",
                  patch: {
                    bannerImageUrl,
                    ...(bannerImageUrl
                      ? { bannerPreset: "", bannerTheme: draft.bannerTheme || "light" }
                      : {}),
                  },
                })
              }
            />

            <div className="lbl" style={{ marginTop: 16 }}>
              Banner library
            </div>
            <div
              className="grid"
              style={{
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 10,
                maxHeight: 240,
                overflow: "auto",
                marginTop: 8,
                paddingRight: 4,
              }}
            >
              {SHOP_BANNER_PRESETS.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`optcard banner-preset-card ${!draft.bannerImageUrl && draft.bannerPreset === id ? "on" : ""}`}
                  aria-pressed={!draft.bannerImageUrl && draft.bannerPreset === id}
                  onClick={() =>
                    dispatch({
                      type: "set",
                      patch: { bannerPreset: id, bannerTheme: "light", bannerImageUrl: "" },
                    })
                  }
                >
                  <img
                    src={`/shop-banners/${id}.png`}
                    alt={label}
                    loading="lazy"
                    className="banner-preset-thumb"
                    width={160}
                    height={52}
                  />
                  <span className="banner-preset-label">{label}</span>
                </button>
              ))}
            </div>
            <div className="lbl" style={{ marginTop: 16 }}>
              Solid
            </div>
            <div
              className="grid"
              style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 8 }}
            >
              <button
                type="button"
                className={`optcard banner-preset-card ${!draft.bannerImageUrl && draft.bannerPreset === "solid-pattern" ? "on" : ""}`}
                aria-pressed={!draft.bannerImageUrl && draft.bannerPreset === "solid-pattern"}
                onClick={() =>
                  dispatch({
                    type: "set",
                    patch: {
                      bannerPreset: "solid-pattern",
                      bannerTheme: "dark",
                      bannerImageUrl: "",
                    },
                  })
                }
              >
                <img
                  src="/shop-banners/solid-pattern.png"
                  alt="Pattern"
                  loading="lazy"
                  className="banner-preset-thumb"
                  width={160}
                  height={52}
                />
                <span className="banner-preset-label">Pattern</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </FullscreenOverlay>
  );
}
