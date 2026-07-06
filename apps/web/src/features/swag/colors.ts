import type { UiCollection, UiProduct } from "@/services/mappers";

const SWAG_COLORS: [string, string][] = [
  ["Black", "#1c1c1c"],
  ["Blue", "#2b54d6"],
  ["Brown", "#7a4a25"],
  ["Green", "#15784c"],
  ["Gray", "#9a9a9a"],
  ["Navy", "#1c2a52"],
  ["Orange", "#f59e0b"],
  ["Pink", "#f4aacb"],
  ["Purple", "#7a3fb0"],
  ["Red", "#d33b30"],
  ["White", "#ffffff"],
  ["Yellow", "#f5d000"],
];
const SWAG_COLOR_HEX: Record<string, string> = Object.fromEntries(SWAG_COLORS);

const DEFAULT_PRODUCT_COLOR_NAMES: Record<string, string[]> = {
  hoodie: ["Black", "Navy", "Blue", "Green", "Gray", "Red"],
  tee: ["Black", "White", "Navy", "Blue", "Red", "Green", "Gray", "Yellow"],
  mug: ["Black", "White"],
  bottle: ["Black", "Blue", "Green", "Gray", "Navy"],
  pack: ["Black", "Navy", "Blue", "Gray"],
  cap: ["Black", "Navy", "Blue", "Gray", "Red"],
  note: ["Black", "Blue", "Red", "Green"],
  power: ["Black", "Blue", "Gray"],
  pillow: ["Black", "Gray", "Blue", "Navy"],
  bag: ["Black", "Brown", "Green", "Navy"],
  default: ["Black", "White", "Navy", "Gray"],
};

const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  hoodie:
    "A comfortable fleece hoodie built for everyday wear. Features a soft interior, adjustable drawstring hood, and kangaroo pocket. Durable construction holds up wash after wash — ideal for corporate gifting, team swag, and employee recognition.",
  tee: "A premium cotton tee with a relaxed fit and smooth hand-feel. Reinforced shoulders and tear-away label make it perfect for branded decoration and bulk gifting programs.",
  bottle:
    "Insulated stainless steel bottle keeps drinks cold for 24 hours or hot for 12. Leak-proof lid and powder-coated finish stand up to daily use.",
  mug: "Glossy ceramic mug with a comfortable C-handle. Microwave and dishwasher safe — a classic choice for desk-side branding.",
  pack: "Structured backpack with padded straps and multiple compartments. Built for commuters and everyday carry with room for a laptop.",
  cap: "Structured twill cap with adjustable closure. Pre-curved visor and breathable panels for all-day comfort.",
  note: "Hard-cover notebook with rounded corners and elastic closure. Acid-free pages ready for notes, sketches, or meeting prep.",
  power:
    "Compact power bank with fast-charge USB-C output. Slim profile slips into a pocket or laptop sleeve.",
  pillow:
    "Memory foam neck pillow with washable cover. Lightweight and travel-ready for road warriors and remote teams.",
  bag: "Organic canvas tote with reinforced handles. Spacious main compartment for groceries, events, or conference swag.",
};

function isHexColor(s: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(String(s || ""));
}

export function swagColorHex(name: string): string {
  return SWAG_COLOR_HEX[name] || "#9a9a9a";
}

/** Default garment tint for swag mockups — always white, never a catalog variant hex. */
export const DEFAULT_MOCKUP_TINT_HEX = SWAG_COLOR_HEX.White;

export function productColorHex(p: UiProduct, name: string): string {
  if (p?.colorHexByName?.[name]) return p.colorHexByName[name];
  if (isHexColor(name)) return name;
  return swagColorHex(name);
}

function sortWhiteFirst(names: string[]): string[] {
  const i = names.findIndex((n) => String(n).toLowerCase() === "white");
  if (i <= 0) return names;
  const out = [...names];
  const [w] = out.splice(i, 1);
  return [w, ...out];
}

function ensureWhitePrimaryNames(names: string[]): string[] {
  if (names.some((n) => String(n).toLowerCase() === "white")) return sortWhiteFirst(names);
  return ["White", ...names];
}

export function productColorNames(p: UiProduct): string[] {
  if (p?.colors?.length) return ensureWhitePrimaryNames(p.colors);
  const names = DEFAULT_PRODUCT_COLOR_NAMES[p?.g] || DEFAULT_PRODUCT_COLOR_NAMES.default;
  return ensureWhitePrimaryNames(names);
}

export function collectionProductColorNames(col: UiCollection, p: UiProduct): string[] {
  const prefs = col?.preferredColors || [];
  const available = productColorNames(p);
  const names = prefs.length
    ? prefs.filter((c) => !available.length || available.includes(c))
    : available;
  return ensureWhitePrimaryNames(names.length ? names : available);
}

export function productDescription(p: UiProduct): string {
  return (
    PRODUCT_DESCRIPTIONS[p?.g] ||
    "Premium branded merchandise ready for your collection. High-quality materials and professional decoration."
  );
}
