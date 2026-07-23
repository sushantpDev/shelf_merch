import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { UiCollection, UiProduct } from "@/services/mappers";
import type { SwagDraft } from "./swagDraft";

/** Build wizard draft state from an existing draft collection. */
export function draftFromCollection(collection: UiCollection, catalog: UiProduct[]): SwagDraft {
  const picked = collection.products
    .map((p) => catalog.findIndex((c) => c.id && c.id === p.id))
    .filter((i) => i >= 0);

  const artworkUrl = resolveMediaUrl(collection.artworkUrl);
  const step: SwagDraft["step"] = picked.length === 0 ? 1 : 2;

  return {
    step: collection.name.trim() ? step : 0,
    name: collection.name,
    picked,
    art: artworkUrl ? { preview: artworkUrl, name: "Existing artwork.png" } : null,
    placements: {},
    placementEpoch: 0,
  };
}
