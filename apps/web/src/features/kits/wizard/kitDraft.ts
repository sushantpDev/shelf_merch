import type { Placement } from "@/features/swag/mockup-bake";
import type { UiKit, UiProduct } from "@/services/mappers";

export type KitArtFile = { preview: string; name: string; file?: File; existing?: boolean };

export type KitDraft = {
  name: string;
  desc: string;
  picked: number[];
  art: KitArtFile | null;
  placements: Record<string, Placement>;
  placementEpoch: number;
  notes: string;
  packaging: "none" | "box";
};

export type KitAction =
  | { type: "setName"; name: string }
  | { type: "setDesc"; desc: string }
  | { type: "togglePick"; index: number }
  | { type: "removePick"; index: number }
  | { type: "setArt"; art: KitArtFile }
  | { type: "clearArt" }
  | { type: "setPlacement"; key: string; placement: Placement }
  | { type: "resetPlacements" }
  | { type: "setNotes"; notes: string }
  | { type: "setPackaging"; packaging: "none" | "box" };

export function kitReducer(state: KitDraft, action: KitAction): KitDraft {
  switch (action.type) {
    case "setName":
      return { ...state, name: action.name };
    case "setDesc":
      return { ...state, desc: action.desc };
    case "togglePick": {
      const has = state.picked.includes(action.index);
      return {
        ...state,
        picked: has
          ? state.picked.filter((i) => i !== action.index)
          : [...state.picked, action.index],
      };
    }
    case "removePick":
      return { ...state, picked: state.picked.filter((i) => i !== action.index) };
    case "setArt":
      return { ...state, art: action.art };
    case "clearArt":
      return {
        ...state,
        art: null,
        placements: {},
        placementEpoch: (state.placementEpoch ?? 0) + 1,
      };
    case "setPlacement":
      return { ...state, placements: { ...state.placements, [action.key]: action.placement } };
    case "resetPlacements":
      return {
        ...state,
        placements: {},
        placementEpoch: (state.placementEpoch ?? 0) + 1,
      };
    case "setNotes":
      return { ...state, notes: action.notes };
    case "setPackaging":
      return { ...state, packaging: action.packaging };
    default:
      return state;
  }
}

/**
 * Resolve the catalog indices for an existing kit's products. Mirrors the
 * legacy `kitPickedIndices`: match by catalog id first, then by name + brand.
 */
export function kitPickedIndices(kit: UiKit, catalog: UiProduct[]): number[] {
  const refs = kit.productRefs ?? [];
  const indices: number[] = [];
  for (const ref of refs) {
    let idx = ref.catalogProductId
      ? catalog.findIndex((p) => p.id && p.id === ref.catalogProductId)
      : -1;
    if (idx < 0 && ref.name) {
      idx = catalog.findIndex((p) => p.nm === ref.name && (p.brand || "") === (ref.brand || ""));
    }
    if (idx >= 0 && !indices.includes(idx)) indices.push(idx);
  }
  return indices;
}
