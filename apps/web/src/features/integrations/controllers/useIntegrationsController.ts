import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Tile } from "../data";
import {
  disconnectZoho,
  fetchZohoStatus,
  startZohoConnect,
  syncZohoEmployees,
  type ZohoConnectionStatus,
  type ZohoIntegrationPublic,
} from "@/services/zoho-api";
import { canAccessTenantArea } from "@/services/tenant-access";
import { getStoredUser } from "@/services/auth-store";
import { ApiError } from "@/services/api";

export type IntegrationsVm = {
  selected: Tile | null;
  onSelect: (tile: Tile) => void;
  onBack: () => void;
  onInstall: (tile: Tile) => void;
  onSupport: () => void;
  onViewPlans: () => void;
  zoho: {
    status: ZohoConnectionStatus;
    configured: boolean;
    integration: ZohoIntegrationPublic | null;
    loading: boolean;
    syncing: boolean;
    connecting: boolean;
    disconnecting: boolean;
    canManage: boolean;
    onConnect: () => void;
    onSync: () => void;
    onDisconnect: () => void;
  };
};

const ZOHO_QUERY_KEY = ["integrations", "zoho", "status"] as const;

/** Controller for the integrations screen: tile selection + Zoho People actions. */
export function useIntegrationsController(): IntegrationsVm {
  const [selected, setSelected] = useState<Tile | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const user = getStoredUser();
  const canManage = canAccessTenantArea(user?.role, "integrations", "write");

  const statusQuery = useQuery({
    queryKey: ZOHO_QUERY_KEY,
    queryFn: fetchZohoStatus,
    staleTime: 30_000,
  });

  useEffect(() => {
    const zoho = searchParams.get("zoho");
    if (!zoho) return;
    if (zoho === "connected") {
      toast.success("Zoho People connected");
      void queryClient.invalidateQueries({ queryKey: ZOHO_QUERY_KEY });
    } else if (zoho === "error") {
      const reason = searchParams.get("reason");
      toast.error(
        reason === "denied"
          ? "Zoho People permission was denied"
          : "Could not connect Zoho People — try again",
      );
    }
    const next = new URLSearchParams(searchParams);
    next.delete("zoho");
    next.delete("reason");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, queryClient]);

  const syncMutation = useMutation({
    mutationFn: syncZohoEmployees,
    onSuccess: (summary) => {
      toast.success(
        `Synced employees — fetched ${summary.totalFetched}, created ${summary.created}, updated ${summary.updated}, skipped ${summary.skipped}, failed ${summary.failed}`,
      );
      void queryClient.invalidateQueries({ queryKey: ZOHO_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Employee sync failed");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectZoho,
    onSuccess: () => {
      toast.success("Zoho People disconnected");
      void queryClient.invalidateQueries({ queryKey: ZOHO_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Disconnect failed");
    },
  });

  const onConnect = useCallback(async () => {
    if (!canManage) {
      toast.error("Only company administrators can connect Zoho People");
      return;
    }
    setConnecting(true);
    try {
      await startZohoConnect();
    } catch (err) {
      setConnecting(false);
      toast.error(err instanceof ApiError ? err.message : "Could not start Zoho connection");
    }
  }, [canManage]);

  const onInstall = useCallback(
    (tile: Tile) => {
      if (tile.id === "zoho-people") {
        void onConnect();
        return;
      }
      toast(`${tile.name} setup started`);
    },
    [onConnect],
  );

  const status = statusQuery.data?.status ?? "not_connected";

  return {
    selected,
    onSelect: setSelected,
    onBack: () => setSelected(null),
    onInstall,
    onSupport: () => toast("Support message opened"),
    onViewPlans: () => toast("Plan details opened"),
    zoho: {
      status,
      configured: statusQuery.data?.configured ?? false,
      integration: statusQuery.data?.integration ?? null,
      loading: statusQuery.isLoading,
      syncing: syncMutation.isPending,
      connecting,
      disconnecting: disconnectMutation.isPending,
      canManage,
      onConnect,
      onSync: () => syncMutation.mutate(),
      onDisconnect: () => disconnectMutation.mutate(),
    },
  };
}
