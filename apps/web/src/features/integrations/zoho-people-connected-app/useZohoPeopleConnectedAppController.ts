import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  disconnectZoho,
  exchangeZohoEmbedCode,
  fetchZohoStatus,
  issueZohoOAuthLaunch,
  syncZohoEmployees,
  type ZohoConnectionStatus,
  type ZohoIntegrationPublic,
} from "@/services/zoho-api";
import { isAuthenticated } from "@/services/auth-store";
import { ApiError } from "@/services/api";
import {
  buildEmbedAuthAck,
  buildOAuthDoneAck,
  createEmbedAuthDedupState,
  createEmbedRequestId,
  handleEmbedAuthMessage,
  isZohoEmbedAuthMessage,
  isZohoOAuthBridgeReadyMessage,
  isZohoOAuthDoneMessage,
  SHELFMERCH_ZOHO_OAUTH_LAUNCH,
  shelfmerchPostMessageOrigin,
} from "./zoho-embed-messaging";

const ZOHO_QUERY_KEY = ["zoho-people-connected-app", "status"] as const;

export type EmbedAuthPhase =
  | "signed_out"
  | "waiting_popup"
  | "exchanging"
  | "authenticated";

export type ZohoPeopleConnectedAppVm = {
  sandbox: boolean;
  authPhase: EmbedAuthPhase;
  popupBlocked: boolean;
  status: ZohoConnectionStatus;
  configured: boolean;
  integration: ZohoIntegrationPublic | null;
  loading: boolean;
  syncing: boolean;
  connecting: boolean;
  disconnecting: boolean;
  canManage: boolean;
  onSignIn: () => void;
  onConnect: () => void;
  onSync: () => void;
  onDisconnect: () => void;
};

function openCenteredPopup(url: string, name: string) {
  const width = 520;
  const height = 640;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
  // Do not pass noopener/noreferrer — opener must remain for postMessage.
  const features = `popup=yes,width=${width},height=${height},left=${left},top=${top}`;
  return window.open(url, name, features);
}

/** Controller for the Zoho People Connected App embed (`/zoho/people`). */
export function useZohoPeopleConnectedAppController(sandbox: boolean): ZohoPeopleConnectedAppVm {
  const [authPhase, setAuthPhase] = useState<EmbedAuthPhase>("signed_out");
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const queryClient = useQueryClient();
  const popupRef = useRef<Window | null>(null);
  const pendingRequestIdRef = useRef<string | null>(null);
  const oauthRequestIdRef = useRef<string | null>(null);
  const oauthLaunchIssuedRef = useRef(new Set<string>());
  const oauthDoneCompletedRef = useRef(new Set<string>());
  const embedAuthDedupRef = useRef(createEmbedAuthDedupState());
  const targetOrigin = shelfmerchPostMessageOrigin();

  const statusQuery = useQuery({
    queryKey: ZOHO_QUERY_KEY,
    queryFn: fetchZohoStatus,
    enabled: authPhase === "authenticated",
    staleTime: 30_000,
    retry: false,
  });

  useEffect(() => {
    if (statusQuery.data?.canManage != null) {
      setCanManage(Boolean(statusQuery.data.canManage));
    }
  }, [statusQuery.data?.canManage]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchZohoStatus();
        if (!cancelled) {
          setCanManage(Boolean(data.canManage));
          setAuthPhase("authenticated");
        }
      } catch {
        if (!cancelled && isAuthenticated()) {
          setAuthPhase("authenticated");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!statusQuery.error) return;
    const err = statusQuery.error;
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      setAuthPhase("signed_out");
    }
  }, [statusQuery.error]);

  const exchangeCode = useCallback(
    async (code: string, requestId: string, source: MessageEventSource | null) => {
      const sendAck = (ackRequestId: string) => {
        if (source && "postMessage" in source && typeof source.postMessage === "function") {
          source.postMessage(buildEmbedAuthAck(ackRequestId), targetOrigin);
        }
      };

      await handleEmbedAuthMessage(
        embedAuthDedupRef.current,
        { code, requestId },
        {
          exchange: exchangeZohoEmbedCode,
          sendAck,
          onExchangeStart: () => setAuthPhase("exchanging"),
          onExchangeSuccess: async () => {
            setAuthPhase("authenticated");
            setPopupBlocked(false);
            popupRef.current = null;
            pendingRequestIdRef.current = null;
            await queryClient.invalidateQueries({ queryKey: ZOHO_QUERY_KEY });
          },
          onExchangeFailure: (err) => {
            if (embedAuthDedupRef.current.completedRequestIds.has(requestId)) {
              return;
            }
            setAuthPhase("signed_out");
            toast.error(err instanceof ApiError ? err.message : "Sign-in failed");
          },
        },
      );
    },
    [queryClient, targetOrigin],
  );

  const sendOAuthLaunch = useCallback(
    async (requestId: string, source: MessageEventSource | null) => {
      if (oauthLaunchIssuedRef.current.has(requestId)) return;
      oauthLaunchIssuedRef.current.add(requestId);
      try {
        const { code } = await issueZohoOAuthLaunch(requestId);
        if (source && "postMessage" in source && typeof source.postMessage === "function") {
          source.postMessage(
            { type: SHELFMERCH_ZOHO_OAUTH_LAUNCH, code, requestId },
            targetOrigin,
          );
        }
      } catch (err) {
        oauthLaunchIssuedRef.current.delete(requestId);
        setConnecting(false);
        toast.error(err instanceof ApiError ? err.message : "Could not start Zoho connection");
      }
    },
    [targetOrigin],
  );

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== targetOrigin) return;
      if (popupRef.current && event.source !== popupRef.current) return;

      if (isZohoEmbedAuthMessage(event.data)) {
        if (
          pendingRequestIdRef.current &&
          event.data.requestId !== pendingRequestIdRef.current
        ) {
          return;
        }
        void exchangeCode(event.data.code, event.data.requestId, event.source);
        return;
      }

      if (isZohoOAuthBridgeReadyMessage(event.data)) {
        if (
          oauthRequestIdRef.current &&
          event.data.requestId !== oauthRequestIdRef.current
        ) {
          return;
        }
        void sendOAuthLaunch(event.data.requestId, event.source);
        return;
      }

      if (isZohoOAuthDoneMessage(event.data)) {
        if (
          oauthRequestIdRef.current &&
          event.data.requestId !== oauthRequestIdRef.current
        ) {
          return;
        }
        const requestId = event.data.requestId;
        if (oauthDoneCompletedRef.current.has(requestId)) {
          if (event.source && "postMessage" in event.source && typeof event.source.postMessage === "function") {
            event.source.postMessage(buildOAuthDoneAck(requestId), targetOrigin);
          }
          return;
        }
        oauthDoneCompletedRef.current.add(requestId);
        setConnecting(false);
        popupRef.current = null;
        oauthRequestIdRef.current = null;
        if (event.data.status === "connected") {
          toast.success("Zoho People connected");
        } else {
          toast.error("Could not connect Zoho People");
        }
        void queryClient.invalidateQueries({ queryKey: ZOHO_QUERY_KEY });
        if (event.source && "postMessage" in event.source && typeof event.source.postMessage === "function") {
          event.source.postMessage(buildOAuthDoneAck(requestId), targetOrigin);
        }
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [exchangeCode, queryClient, sendOAuthLaunch, targetOrigin]);

  const onSignIn = useCallback(() => {
    const requestId = createEmbedRequestId();
    pendingRequestIdRef.current = requestId;
    const url = `/zoho/people/embed-auth?requestId=${encodeURIComponent(requestId)}`;
    const popup = openCenteredPopup(url, "shelfmerch-zoho-embed-auth");
    if (!popup) {
      setPopupBlocked(true);
      pendingRequestIdRef.current = null;
      return;
    }
    popupRef.current = popup;
    setPopupBlocked(false);
    setAuthPhase("waiting_popup");
  }, []);

  const onConnect = useCallback(() => {
    if (!canManage) {
      toast.error("Only company administrators can connect Zoho People");
      return;
    }
    setConnecting(true);
    const requestId = createEmbedRequestId();
    oauthRequestIdRef.current = requestId;
    const url = `/zoho/people/oauth-bridge?requestId=${encodeURIComponent(requestId)}`;
    const popup = openCenteredPopup(url, "shelfmerch-zoho-oauth");
    if (!popup) {
      setConnecting(false);
      setPopupBlocked(true);
      oauthRequestIdRef.current = null;
      toast.error("Allow popups and try again");
      return;
    }
    popupRef.current = popup;
    setPopupBlocked(false);
  }, [canManage]);

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

  return {
    sandbox,
    authPhase,
    popupBlocked,
    status: statusQuery.data?.status ?? "not_connected",
    configured: statusQuery.data?.configured ?? false,
    integration: statusQuery.data?.integration ?? null,
    loading: authPhase === "authenticated" && statusQuery.isLoading,
    syncing: syncMutation.isPending,
    connecting,
    disconnecting: disconnectMutation.isPending,
    canManage,
    onSignIn,
    onConnect,
    onSync: () => syncMutation.mutate(),
    onDisconnect: () => disconnectMutation.mutate(),
  };
}
