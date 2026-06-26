import { type Dispatch, useState } from "react";
import { Briefcase, Coffee, Dumbbell, Gem, Pencil, Shirt, Sparkles, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FullscreenOverlay } from "@/components/tenant/FullscreenOverlay";
import {
  BANNER_THEMES,
  SHOP_BANNER_PRESETS,
  bannerBackgroundStyle,
  type BannerSource,
} from "./banner";
import type { ShopDraft, ShopDraftAction } from "./CreateShopWizard";
import { BUILDER_CATEGORIES } from "./types";

const GROUP_ICON: Record<string, typeof Coffee> = {
  mug: Coffee,
  note: Briefcase,
  tee: Shirt,
  cap: Shirt,
  bottle: Dumbbell,
  spark: Sparkles,
  bag: Gem,
};

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
    logoUrl: draft.logoUrl,
  };
  const theme = BANNER_THEMES[draft.bannerTheme] || BANNER_THEMES.light;
  const hasPreset = Boolean(draft.bannerPreset);

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
          style={{
            position: "relative",
            height: 170,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            ...bannerBackgroundStyle(source),
          }}
        >
          {draft.logoUrl && (
            <div
              style={{
                width: 96,
                height: 96,
                background: "#fff",
                borderRadius: 16,
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
                padding: 10,
                ...(hasPreset
                  ? { position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)" }
                  : {}),
              }}
            >
              <img
                src={draft.logoUrl}
                alt="Shop logo"
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            </div>
          )}
          {!hasPreset && (
            <div
              style={{
                fontFamily: "var(--disp)",
                fontWeight: 800,
                fontSize: 40,
                color: theme.text,
              }}
            >
              {draft.name || "Your shop name"}
            </div>
          )}
          <button
            type="button"
            className="btn btn-soft btn-sm"
            style={{ position: "absolute", top: 16, right: 16 }}
            onClick={() => setBannerOpen(true)}
          >
            <Pencil size={14} /> Edit banner
          </button>
        </div>

        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "30px 24px" }} className="fade-in">
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Choose categories for your shop</h2>
          <p className="muted" style={{ marginBottom: 20 }}>
            Pick categories for recipients to shop from. After saving, you can enable/disable
            individual products.
          </p>
          <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
            {BUILDER_CATEGORIES.map(([category, group]) => {
              const selected = draft.categories.includes(category);
              const Icon = GROUP_ICON[group] || Sparkles;
              return (
                <button
                  key={category}
                  type="button"
                  className={`optcard ${selected ? "on" : ""}`}
                  aria-pressed={selected}
                  onClick={() => dispatch({ type: "toggleCategory", category })}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      border: `2px solid ${selected ? "var(--brand)" : "#c4ccc6"}`,
                      borderRadius: 4,
                      display: "grid",
                      placeItems: "center",
                      background: selected ? "var(--brand)" : "#fff",
                      flex: "none",
                    }}
                  >
                    {selected && <Check size={12} color="#fff" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4>{category}</h4>
                  </div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: "var(--surface-2)",
                      display: "grid",
                      placeItems: "center",
                      flex: "none",
                    }}
                  >
                    <Icon size={18} color="#9aa39c" />
                  </div>
                </button>
              );
            })}
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
              Choose a banner image or solid color for your shop.
            </p>
            <div className="lbl">Banner image</div>
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
                  className={`optcard banner-preset-card ${draft.bannerPreset === id ? "on" : ""}`}
                  aria-pressed={draft.bannerPreset === id}
                  onClick={() =>
                    dispatch({ type: "set", patch: { bannerPreset: id, bannerTheme: "light" } })
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
              Solid color
            </div>
            <div
              className="grid"
              style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 8 }}
            >
              {Object.keys(BANNER_THEMES).map((k) => {
                const t = BANNER_THEMES[k];
                const swatch = t.dots
                  ? {
                      backgroundImage: `radial-gradient(rgba(255,255,255,.18) 1.4px,transparent 1.4px),${t.bg.startsWith("linear-gradient") ? t.bg : `linear-gradient(${t.bg},${t.bg})`}`,
                      backgroundSize: "14px 14px,auto",
                    }
                  : { background: t.bg };
                return (
                  <button
                    key={k}
                    type="button"
                    className={`optcard ${draft.bannerTheme === k && !draft.bannerPreset ? "on" : ""}`}
                    style={{ padding: 12, textAlign: "center" }}
                    aria-pressed={draft.bannerTheme === k && !draft.bannerPreset}
                    onClick={() =>
                      dispatch({ type: "set", patch: { bannerTheme: k, bannerPreset: "" } })
                    }
                  >
                    <div style={{ height: 40, borderRadius: 8, ...swatch }} />
                    <div
                      style={{
                        fontSize: 12,
                        marginTop: 8,
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    >
                      {k}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </FullscreenOverlay>
  );
}
