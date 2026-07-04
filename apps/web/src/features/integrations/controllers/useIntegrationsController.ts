import { useState } from "react";
import { toast } from "sonner";
import type { Tile } from "../data";

export type IntegrationsVm = {
  selected: Tile | null;
  onSelect: (tile: Tile) => void;
  onBack: () => void;
  onInstall: (tile: Tile) => void;
  onSupport: () => void;
  onViewPlans: () => void;
};

/** Controller for the integrations screen: tile selection + demo actions. */
export function useIntegrationsController(): IntegrationsVm {
  const [selected, setSelected] = useState<Tile | null>(null);

  return {
    selected,
    onSelect: setSelected,
    onBack: () => setSelected(null),
    onInstall: (tile) => toast(`${tile.name} setup started`),
    onSupport: () => toast("Support message opened"),
    onViewPlans: () => toast("Plan details opened"),
  };
}
