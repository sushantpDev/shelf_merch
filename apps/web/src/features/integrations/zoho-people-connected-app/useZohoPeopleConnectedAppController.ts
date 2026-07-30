import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  disconnectZoho,
  fetchZohoStatus,
  startZohoConnect,
  syncZohoEmployees,
  type ZohoConnectionStatus,
  type ZohoIntegrationPublic,
} from "@/services/zoho-api";
import { canAccessTenantArea } from "@/services/tenant-access";
import { getStoredUser, isAuthenticated } from "@/services/auth-store";
import { ApiError } from "@/services/api";

const ZOHO_QUERY_KEY = ["zoho-people-connected-app", "status"] as const;

export const SHELFMERCH_INTEGRATIONS_URL =
  "https://shelfmerch.io/app/integrations?source=zoho-people";

export type ZohoPeopleConnectedAppVm = {
  sandbox: boolean;
  authenticated: boolean;
  status: ZohoConnectionStatus;
  configured: boolean;
  integration: ZohoIntegrationPublic | null;
  loading: boolean;
  syncing: boolean;
  connecting: boolean;
  disconnecting: boolean;
  canManage: boolean;
  authError: boolean;
  onConnect: () => void;
  onSync: () => void;
  onDisconnect: () => void;
  onOpenShelfMerch: () => void;
};

/** Controller for the Zoho People Connected App embed (`/zoho/people`). */
export function useZohoPeopleConnectedAppController(sandbox: boolean): ZohoPeopleConnectedAppVm {
  const [connecting, setConnecting] = useState(false);
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated());
  const queryClient = useQueryClient();
  const user = getStoredUser();
  const canManage = canAccessTenantArea(user?.role, "integrations", "write");

  useEffect(() => {
    const sync = () => setAuthenticated(isAuthenticated());
    window.addEventListener("sm:auth-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("sm:auth-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const statusQuery = useQuery({
    queryKey: ZOHO_QUERY_KEY,
    queryFn: fetchZohoStatus,
    enabled: authenticated,
    staleTime: 30_000,
    retry: false,
  });

  useEffect(() => {
    if (!statusQuery.error) return;
    const err = statusQuery.error;
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      setAuthenticated(false);
    }
  }, [statusQuery.error]);

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

  const onOpenShelfMerch = useCallback(() => {
    window.open(SHELFMERCH_INTEGRATIONS_URL, "_blank", "noopener,noreferrer");
  }, []);

  const authError =
    Boolean(statusQuery.error) &&
    statusQuery.error instanceof ApiError &&
    (statusQuery.error.status === 401 || statusQuery.error.status === 403);

  return {
    sandbox,
    authenticated: authenticated && !authError,
    status: statusQuery.data?.status ?? "not_connected",
    configured: statusQuery.data?.configured ?? false,
    integration: statusQuery.data?.integration ?? null,
    loading: authenticated && statusQuery.isLoading,
    syncing: syncMutation.isPending,
    connecting,
    disconnecting: disconnectMutation.isPending,
    canManage,
    authError,
    onConnect,
    onSync: () => syncMutation.mutate(),
    onDisconnect: () => disconnectMutation.mutate(),
    onOpenShelfMerch,
  };
}
