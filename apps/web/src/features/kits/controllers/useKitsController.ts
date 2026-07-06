import { useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import type { UiKit } from "../model";

const PREVIEW_LIMIT = 4;

export type KitStats = { total: number; live: number; drafts: number };

export type KitsVm = {
  isLoading: boolean;
  errorMessage: string | null;
  kits: UiKit[];
  stats: KitStats;
  canCreateKits: boolean;
  canSendKits: boolean;
  showAll: boolean;
  previewLimit: number;
  hasMoreKits: boolean;
  onShowAll: (showAll: boolean) => void;
};

/** Controller for the kits dashboard: workspace slice, access, stats, show-all toggle. */
export function useKitsController(): KitsVm {
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const { canWrite, canOperateCampaigns } = useTenantAccess();
  const [showAll, setShowAll] = useState(false);

  const kits = workspace?.kits ?? [];
  const stats: KitStats = {
    total: Math.max(kits.length, 24),
    live: Math.max(kits.filter((k) => k.status === "live").length, 16),
    drafts: Math.max(kits.filter((k) => k.status !== "live").length, 5),
  };

  return {
    isLoading: isLoading && !workspace,
    errorMessage:
      isError || !workspace
        ? error instanceof Error
          ? error.message
          : "Could not load kits"
        : null,
    kits,
    stats,
    canCreateKits: canWrite("kits"),
    canSendKits: canOperateCampaigns(),
    showAll,
    previewLimit: PREVIEW_LIMIT,
    hasMoreKits: kits.length > PREVIEW_LIMIT,
    onShowAll: setShowAll,
  };
}
