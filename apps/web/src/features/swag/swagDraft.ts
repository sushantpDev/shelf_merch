import type { Placement } from "./mockup-bake";

export type ArtFile = { preview: string; name: string; file?: File };

export type SwagDraft = {
  step: 0 | 1 | 2;
  name: string;
  picked: number[];
  art: ArtFile | null;
  placements: Record<string, Placement>;
};

export const INITIAL_SWAG_DRAFT: SwagDraft = {
  step: 0,
  name: "New Employee Swag",
  picked: [],
  art: null,
  placements: {},
};

export type SwagAction =
  | { type: "setStep"; step: 0 | 1 | 2 }
  | { type: "setName"; name: string }
  | { type: "togglePick"; index: number }
  | { type: "setArt"; art: ArtFile }
  | { type: "clearArt" }
  | { type: "setPlacement"; key: string; placement: Placement }
  | { type: "resetPlacements" };

export function swagDraftReducer(state: SwagDraft, action: SwagAction): SwagDraft {
  switch (action.type) {
    case "setStep":
      return { ...state, step: action.step };
    case "setName":
      return { ...state, name: action.name };
    case "togglePick": {
      const has = state.picked.includes(action.index);
      return {
        ...state,
        picked: has
          ? state.picked.filter((i) => i !== action.index)
          : [...state.picked, action.index],
      };
    }
    case "setArt":
      return { ...state, art: action.art };
    case "clearArt":
      return { ...state, art: null, placements: {} };
    case "setPlacement":
      return { ...state, placements: { ...state.placements, [action.key]: action.placement } };
    case "resetPlacements":
      return { ...state, placements: {} };
    default:
      return state;
  }
}
