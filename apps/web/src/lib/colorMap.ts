/**
 * Colour-name → hex resolution for garment mask recolouring.
 *
 * Ported from the printify-clone admin uploader so a variant defined only by a
 * colour name (e.g. Shopify imports) can still drive the mask tint. A variant's
 * own `colorHex` always wins unless it is the unresolved placeholder.
 */

export const COLOR_MAP: Record<string, string> = {
  white: "#FFFFFF",
  black: "#000000",
  gray: "#808080",
  grey: "#808080",
  "light gray": "#D3D3D3",
  "light grey": "#D3D3D3",
  "dark gray": "#A9A9A9",
  "dark grey": "#A9A9A9",
  charcoal: "#36454F",
  graphite: "#383838",
  silver: "#C0C0C0",

  red: "#FF0000",
  blue: "#0000FF",
  green: "#008000",
  yellow: "#FFFF00",
  orange: "#FFA500",
  pink: "#FFC0CB",
  purple: "#800080",

  navy: "#000080",
  "navy blue": "#000080",
  "midnight navy": "#1a2744",
  "dark navy": "#000033",
  "royal blue": "#4169E1",
  royal: "#4169E1",
  "sky blue": "#87CEEB",
  "carolina blue": "#56A0D3",
  "light blue": "#ADD8E6",
  "baby blue": "#89CFF0",
  "steel blue": "#4682B4",
  denim: "#1560BD",
  indigo: "#4B0082",
  teal: "#008080",
  cyan: "#00FFFF",

  "forest green": "#228B22",
  "kelly green": "#4CBB17",
  "irish green": "#009A44",
  "hunter green": "#355E3B",
  "bottle green": "#006A4E",
  "dark green": "#006400",
  "light green": "#90EE90",
  "mint green": "#98FF98",
  olive: "#808000",
  sage: "#B2AC88",
  "military green": "#4A5240",
  lime: "#00FF00",
  emerald: "#50C878",
  jade: "#00A36C",

  brown: "#A52A2A",
  tan: "#D2B48C",
  beige: "#F5F5DC",
  khaki: "#C3B091",
  sand: "#C2B280",
  stone: "#928E85",
  taupe: "#483C32",
  mocha: "#967969",
  chocolate: "#7B3F00",
  caramel: "#C68642",
  oatmeal: "#E8D9C0",

  maroon: "#800000",
  burgundy: "#800020",
  crimson: "#DC143C",
  cardinal: "#C41E3A",
  cranberry: "#9E0038",
  oxblood: "#4A0000",

  gold: "#FFD700",
  "rose gold": "#E8B4B8",
  bronze: "#CD7F32",
  copper: "#B87333",

  cream: "#FFFDD0",
  ivory: "#FFFFF0",
  "off white": "#FAF9F6",
  "vintage white": "#F5F0E8",
  natural: "#F5F5DC",
  coral: "#FF7F50",
  salmon: "#FA8072",
  lavender: "#E6E6FA",
  peach: "#FFE5B4",
  magenta: "#FF00FF",
  fuchsia: "#FF00FF",
  "hot pink": "#FF69B4",
  "light pink": "#FFB6C1",
  "dusty rose": "#DCAE96",

  violet: "#8A2BE2",
  grape: "#6F2DA8",
  plum: "#8E4585",
  eggplant: "#614051",
  orchid: "#DA70D6",
  lilac: "#C8A2C8",
  periwinkle: "#CCCCFF",
  midnight: "#191970",

  // Heathers / sport greys (very common in POD)
  heather: "#9E9E9E",
  "heather gray": "#9E9E9E",
  "heather grey": "#9E9E9E",
  "sport gray": "#8D8D8D",
  "sport grey": "#8D8D8D",
  "athletic heather": "#B2B2B2",
  "dark heather": "#5A5A5A",
  "heather navy": "#4A5A7A",
  "heather royal": "#5A7ABF",
  "heather red": "#C05050",

  mustard: "#FFDB58",
  lemon: "#FFF44F",
  "burnt orange": "#CC5500",
  rust: "#B7410E",
  pumpkin: "#FF7518",
};

/** Default hex used when a colour name cannot be resolved. */
export const DEFAULT_COLOR_HEX = "#CCCCCC";

export function normalizeColorKey(color: string): string {
  return color.toLowerCase().trim().replace(/\s+/g, " ");
}

/** Treat empty or the #CCCCCC placeholder as "no real colour set". */
export function isPlaceholderColorHex(hex?: string | null): boolean {
  if (!hex) return true;
  return hex.replace("#", "").toLowerCase() === "cccccc";
}

/** Map a colour name to a hex, with progressively looser matching. */
export function getColorHex(colorName: string): string {
  if (!colorName) return DEFAULT_COLOR_HEX;
  const normalized = normalizeColorKey(colorName);
  if (COLOR_MAP[normalized]) return COLOR_MAP[normalized];

  const variations = [
    normalized.replace(/\s+/g, ""),
    normalized.replace(/-/g, ""),
    normalized.replace(/\s+/g, "-"),
    normalized.replace(/-/g, " "),
  ];
  for (const variation of variations) {
    if (COLOR_MAP[variation]) return COLOR_MAP[variation];
  }

  const words = normalized.split(/\s+/);
  if (words.length > 1) {
    const last = words[words.length - 1];
    if (COLOR_MAP[last]) return COLOR_MAP[last];
    const first = words[0];
    if (COLOR_MAP[first]) return COLOR_MAP[first];
  }
  return DEFAULT_COLOR_HEX;
}

/** Prefer a stored variant hex unless it is the unresolved placeholder. */
export function resolveColorHex(colorName?: string, storedHex?: string | null): string {
  if (storedHex && !isPlaceholderColorHex(storedHex)) return storedHex;
  return getColorHex(colorName || "");
}
