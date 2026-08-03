import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import {
  getPublicStorefront,
  getPublicStorefrontBySlug,
  getRedemptionPortal,
  listRedemptionOrders,
  listRedemptionTickets,
  raiseRedemptionTicket,
  replyRedemptionTicket,
  confirmRedemptionTicket,
  submitRedemption,
  type StorefrontData,
  type StoreSupportTicket,
} from "@/services/api-bridge";
import {
  clearShopCustomerSession,
  getShopCustomerSession,
  setShopCustomerSession,
  type ShopCustomerSession,
} from "@/services/shop-customer-store";
import type { CheckoutItem, CheckoutPayment, ShippingAddress } from "@/components/store/StoreShell";

export type StorefrontState = "loading" | "ready" | "error";

export type StorefrontVm = {
  state: StorefrontState;
  data: StorefrontData | null;
  error: string;
  shopId: string;
  session: ShopCustomerSession | null;
  sessionToken: string;
  authOpen: boolean;
  authMode: "signin" | "signup";
  onOpenAuth: (mode?: "signin" | "signup") => void;
  onCloseAuth: () => void;
  onAuthenticated: (session: ShopCustomerSession) => void;
  onLogout: () => void;
  onCheckout: (
    items: CheckoutItem[],
    shippingAddress: ShippingAddress,
    payment?: CheckoutPayment,
  ) => Promise<{ orderNumber: string; remainingCredit?: number }>;
  onFetchOrders: () => Promise<{ orders: never[]; creditAmount: number }>;
  onFetchTickets: () => Promise<{ items: StoreSupportTicket[] }>;
  onRaiseTicket: (body: {
    subject: string;
    description?: string;
    type?: string;
  }) => Promise<StoreSupportTicket>;
  onReplyTicket: (ticketId: string, body: string) => Promise<StoreSupportTicket>;
  onConfirmTicket: (ticketId: string) => Promise<StoreSupportTicket>;
};

/** Public storefront: browse freely; cart/checkout require shop-customer session. */
export function useStorefrontController(opts: {
  shopId?: string;
  slug?: string;
}): StorefrontVm {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<StorefrontState>("loading");
  const [data, setData] = useState<StorefrontData | null>(null);
  const [error, setError] = useState("");
  const [shopId, setShopId] = useState(opts.shopId || "");
  const [session, setSession] = useState<ShopCustomerSession | null>(null);
  const [sessionToken, setSessionToken] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    const auth = searchParams.get("auth");
    if (auth === "signup" || auth === "signin") {
      setAuthMode(auth);
      setAuthOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("auth");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState("loading");
      setError("");
      try {
        let res: StorefrontData;
        if (opts.shopId) {
          res = await getPublicStorefront(opts.shopId);
        } else if (opts.slug) {
          const meta = await getPublicStorefrontBySlug(opts.slug);
          res = await getPublicStorefront(meta.shop.id);
        } else {
          throw new Error("Missing shop");
        }
        if (cancelled) return;
        setData(res);
        setShopId(res.shop.id);
        const existing = getShopCustomerSession(res.shop.id);
        if (existing) setSession(existing);
        setState("ready");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Shop unavailable");
        setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [opts.shopId, opts.slug]);

  useEffect(() => {
    if (!session?.redemptionToken) {
      setSessionToken("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const portal = (await getRedemptionPortal(session.redemptionToken!)) as {
          sessionToken?: string;
          recipient?: { creditAmount?: number };
        };
        if (cancelled) return;
        if (portal.sessionToken) setSessionToken(portal.sessionToken);
        if (portal.recipient?.creditAmount != null) {
          const next = { ...session, creditAmount: portal.recipient.creditAmount };
          setSession(next);
          setShopCustomerSession(shopId, next);
        }
      } catch {
        if (!cancelled) setSessionToken("");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only refresh when token changes
  }, [session?.redemptionToken, shopId]);

  const onAuthenticated = useCallback((next: ShopCustomerSession) => {
    setSession(next);
    setAuthOpen(false);
  }, []);

  const onLogout = useCallback(() => {
    if (shopId) clearShopCustomerSession(shopId);
    setSession(null);
    setSessionToken("");
  }, [shopId]);

  const onCheckout = useCallback(
    async (
      items: CheckoutItem[],
      shippingAddress: ShippingAddress,
      payment?: CheckoutPayment,
    ) => {
      if (!session?.redemptionToken || !sessionToken) {
        throw new Error("Please sign in again to complete checkout.");
      }
      const result = (await submitRedemption(
        session.redemptionToken,
        sessionToken,
        {
          items,
          shippingAddress,
          paymentMode: payment?.mode ?? "points",
          razorpayPayment: payment?.razorpay,
        },
        `store-${shopId}-${Date.now()}`,
      )) as { orderNumber: string; remainingCredit?: number | null };
      if (result.remainingCredit != null) {
        const next = { ...session, creditAmount: result.remainingCredit };
        setSession(next);
        setShopCustomerSession(shopId, next);
      }
      return {
        orderNumber: result.orderNumber,
        remainingCredit: result.remainingCredit ?? undefined,
      };
    },
    [session, sessionToken, shopId],
  );

  const onFetchOrders = useCallback(async () => {
    if (!session?.redemptionToken || !sessionToken) {
      return { orders: [], creditAmount: session?.creditAmount ?? 0 };
    }
    return listRedemptionOrders(session.redemptionToken, sessionToken) as Promise<{
      orders: never[];
      creditAmount: number;
    }>;
  }, [session, sessionToken]);

  const onFetchTickets = useCallback(async () => {
    if (!session?.redemptionToken || !sessionToken) return { items: [] };
    return listRedemptionTickets(session.redemptionToken, sessionToken);
  }, [session, sessionToken]);

  const onRaiseTicket = useCallback(
    async (body: { subject: string; description?: string; type?: string }) => {
      if (!session?.redemptionToken || !sessionToken) throw new Error("Sign in required");
      return raiseRedemptionTicket(session.redemptionToken, sessionToken, body);
    },
    [session, sessionToken],
  );

  const onReplyTicket = useCallback(
    async (ticketId: string, body: string) => {
      if (!session?.redemptionToken || !sessionToken) throw new Error("Sign in required");
      return replyRedemptionTicket(session.redemptionToken, sessionToken, ticketId, body);
    },
    [session, sessionToken],
  );

  const onConfirmTicket = useCallback(
    async (ticketId: string) => {
      if (!session?.redemptionToken || !sessionToken) throw new Error("Sign in required");
      return confirmRedemptionTicket(session.redemptionToken, sessionToken, ticketId);
    },
    [session, sessionToken],
  );

  return {
    state,
    data,
    error,
    shopId,
    session,
    sessionToken,
    authOpen,
    authMode,
    onOpenAuth: (mode = "signin") => {
      setAuthMode(mode);
      setAuthOpen(true);
    },
    onCloseAuth: () => setAuthOpen(false),
    onAuthenticated,
    onLogout,
    onCheckout,
    onFetchOrders,
    onFetchTickets,
    onRaiseTicket,
    onReplyTicket,
    onConfirmTicket,
  };
}
