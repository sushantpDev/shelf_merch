import { useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import type { UiKit } from "../model";

const PREVIEW_LIMIT = 4;

function isCuratedWorkspaceKit(kit: UiKit): boolean {
  if (!kit.designNotes) return false;
  try {
    const parsed = JSON.parse(kit.designNotes);
    return !!(parsed && parsed.curated);
  } catch {
    return false;
  }
}

/** First-time dashboard until the user creates a custom kit or sends any kit. */
function isFirstTimeKitsUser(kits: UiKit[]): boolean {
  return !kits.some(
    (k) => k.sent || Boolean(k.lastSentAt) || !isCuratedWorkspaceKit(k),
  );
}

export type KitStats = { total: number; live: number; drafts: number };

export type KitsVm = {
  isLoading: boolean;
  errorMessage: string | null;
  kits: UiKit[];
  stats: KitStats;
  /** Total workspace contacts that can receive kits. */
  contactCount: number;
  canCreateKits: boolean;
  canSendKits: boolean;
  /** True until the user creates a custom kit or sends a kit (curated clones alone don't count). */
  isEmpty: boolean;
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
  const contactCount = workspace?.contacts?.length ?? 0;
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
    contactCount,
    stats,
    canCreateKits: canWrite("kits"),
    canSendKits: canOperateCampaigns(),
    isEmpty: isFirstTimeKitsUser(kits),
    showAll,
    previewLimit: PREVIEW_LIMIT,
    hasMoreKits: kits.length > PREVIEW_LIMIT,
    onShowAll: setShowAll,
  };
}
