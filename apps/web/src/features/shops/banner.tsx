import type { CSSProperties } from "react";
import { MoreHorizontal } from "lucide-react";

/** Solid-colour banner themes (ported from the legacy BANNER_THEMES). */
export const BANNER_THEMES: Record<string, { bg: string; text: string; dots: boolean }> = {
  light: { bg: "#FBFCFB", text: "#0E1E16", dots: false },
  brand: { bg: "linear-gradient(135deg,#15784C,#0E5536)", text: "#fff", dots: true },
  dark: { bg: "#0E1E16", text: "#fff", dots: true },
  blue: { bg: "linear-gradient(135deg,#2563C9,#1e40af)", text: "#fff", dots: true },
  purple: { bg: "linear-gradient(135deg,#7a3fb0,#5b21b6)", text: "#fff", dots: true },
};

export const SHOP_BANNER_PRESETS: [string, string][] = [
  ["dia-de-los-muertos", "Feliz Dia de los Muertos"],
  ["happy-passover", "Happy Passover"],
  ["thats-a-wrap", "That's a Wrap!"],
  ["out-of-this-world", "Out of This World"],
  ["happy-summer", "Happy Summer"],
  ["snack-break", "Snack Break"],
  ["pizza-party", "Pizza Party"],
  ["happy-pride", "Happy Pride"],
  ["mothers-day", "Mother's Day"],
  ["handcrafted-haven", "Handcrafted Haven"],
  ["exceptional-leader", "Exceptional Leader"],
  ["stellar-performance", "Stellar Performance"],
  ["standing-ovation", "Standing Ovation"],
  ["surprise", "Surprise!"],
  ["welcome", "Welcome"],
  ["happy-birthday", "Happy Birthday"],
  ["happy-holi", "Happy Holi"],
  ["merry-christmas", "Merry Christmas"],
  ["we-did-it", "We Did It!"],
];

/** A banner source — either a saved shop or the in-flight wizard/editor state. */
export type BannerSource = {
  bannerTheme?: string;
  bannerPreset?: string;
  bannerConfig?: { theme?: string; preset?: string } | Record<string, unknown>;
  logoUrl?: string;
};

export function bannerThemeKey(src: BannerSource): string {
  const cfg = src.bannerConfig as { theme?: string } | undefined;
  return src.bannerTheme || cfg?.theme || "light";
}

export function bannerPresetKey(src: BannerSource): string {
  const cfg = src.bannerConfig as { preset?: string } | undefined;
  return src.bannerPreset || cfg?.preset || "";
}

/** Serialize a banner source into the `bannerConfig` the API expects. */
export function bannerConfigFromSource(src: BannerSource): Record<string, string> {
  const preset = bannerPresetKey(src);
  const theme = bannerThemeKey(src) || "light";
  if (preset) return { preset, theme };
  return theme === "light" ? {} : { theme };
}

function gradientBase(bg: string): string {
  return bg.startsWith("linear-gradient") ? bg : `linear-gradient(${bg},${bg})`;
}

export function bannerBackgroundStyle(src: BannerSource): CSSProperties {
  return bannerStyle(src);
}

function bannerStyle(src: BannerSource): CSSProperties {
  const preset = bannerPresetKey(src);
  if (preset) {
    return {
      backgroundImage: `url(/shop-banners/${preset}.png)`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  const t = BANNER_THEMES[bannerThemeKey(src)] || BANNER_THEMES.light;
  if (t.dots) {
    return {
      backgroundImage: `radial-gradient(rgba(255,255,255,.18) 1.4px,transparent 1.4px),${gradientBase(t.bg)}`,
      backgroundSize: "14px 14px,auto",
    };
  }
  return { background: t.bg };
}

function bannerClasses(src: BannerSource): string {
  const t = BANNER_THEMES[bannerThemeKey(src)] || BANNER_THEMES.light;
  return `shopbanner${t.dots && !bannerPresetKey(src) ? " shopbanner-merch" : ""}`;
}

/** Renders a shop banner with optional centered/left logo overlay and edit menu. */
export function ShopBanner({
  source,
  height = 96,
  radius = 0,
  logoSize = 48,
  layout = "left",
  onEdit,
}: {
  source: BannerSource;
  height?: number;
  radius?: number;
  logoSize?: number;
  layout?: "left" | "center";
  onEdit?: () => void;
}) {
  const logoUrl = source.logoUrl || "";
  const logoPos: CSSProperties =
    layout === "center"
      ? { left: "50%", top: "50%", transform: "translate(-50%,-50%)" }
      : { left: 18, top: "50%", transform: "translateY(-50%)" };

  return (
    <div
      className={bannerClasses(source)}
      style={{ height, borderRadius: radius, position: "relative", ...bannerStyle(source) }}
    >
      {logoUrl && (
        <div
          style={{
            position: "absolute",
            width: logoSize,
            height: logoSize,
            background: "#fff",
            borderRadius: 12,
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
            padding: 4,
            zIndex: 1,
            boxShadow: "0 2px 8px rgba(0,0,0,.12)",
            ...logoPos,
          }}
        >
          <img
            src={logoUrl}
            alt="Shop logo"
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
          />
        </div>
      )}
      {onEdit && (
        <button
          type="button"
          className="shopbanner-menu"
          aria-label="Edit shop look"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
        >
          <MoreHorizontal size={18} />
        </button>
      )}
    </div>
  );
}
