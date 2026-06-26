import type { UiProduct } from "@/services/mappers";

/** Category tabs, matching the legacy catalog filter rail. */
export const CATALOG_CATEGORIES = [
  "All Products",
  "Apparel",
  "Bags",
  "Drinkware",
  "Technology",
  "Office",
  "Health & Wellness",
] as const;

export const ALL_PRODUCTS = "All Products";

/** Parse a "Label: value" newline block into rows (key features / size guide). */
export function detailRows(value: string | undefined): [string, string][] {
  return String(value || "")
    .split("\n")
    .map((line): [string, string] => {
      const split = line.indexOf(":");
      return split > 0
        ? [line.slice(0, split).trim(), line.slice(split + 1).trim()]
        : [line.trim(), ""];
    })
    .filter(([label, val]) => label || val);
}

/** Catalog product display id (last 8 of the id, or a padded index fallback). */
export function productUniqueId(p: UiProduct, index: number): string {
  return p.id ? String(p.id).slice(-8).toUpperCase() : String(index + 1).padStart(8, "0");
}

/** Resolve display swatches: color name → hex (falls back to the name itself). */
export function productSwatches(p: UiProduct): { name: string; hex: string }[] {
  const names = p.colors ?? [];
  return names.map((name) => ({ name, hex: p.colorHexByName?.[name] || name }));
}
