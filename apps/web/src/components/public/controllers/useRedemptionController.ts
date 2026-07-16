import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  getRedemptionCatalog,
  getRedemptionKit,
  getRedemptionPortal,
  listRedemptionOrders,
  listRedemptionTickets,
  raiseRedemptionTicket,
  replyRedemptionTicket,
  sendRedemptionOtp,
  submitRedemption,
  trackRedemption,
  verifyRedemptionOtp,
  type KitRedemptionData,
  type RedemptionOrderSummary,
  type StoreSupportTicket,
} from "@/services/api-bridge";
import type { StoreShop } from "@/components/StoreBanner";
import type { CheckoutItem, CheckoutPayment, ShippingAddress, StoreProduct } from "@/components/store/StoreShell";

export type RedemptionStep = "loading" | "portal" | "otp" | "shop" | "kit" | "track" | "error";

type Shop = StoreShop & { currencyMode?: "points" | "inr" | "priceless" };

export type PortalData = {
  campaign: {
    name: string;
    type?: string;
    message?: { body?: string };
    shop?: Shop | null;
  };
  recipient: { name: string; email?: string; creditAmount: number };
  alreadyVerified?: boolean;
  sessionToken?: string;
};

export type RedemptionVm = {
  step: RedemptionStep;
  portal: PortalData | null;
  error: string;
  contact: string;
  otp: string;
  sessionToken: string;
  products: StoreProduct[];
  kitData: KitRedemptionData | null;
  order: { orderNumber?: string; status?: string } | null;
  token: string;
  isKitFlow: boolean;
  isSendingOtp: boolean;
  isVerifyingOtp: boolean;
  onContact: (contact: string) => void;
  onOtp: (otp: string) => void;
  onSendOtp: () => Promise<void>;
  onVerifyOtp: () => Promise<void>;
  onCheckout: (
    items: CheckoutItem[],
    shippingAddress: ShippingAddress,
    payment?: CheckoutPayment,
  ) => Promise<{ orderNumber: string; remainingCredit?: number }>;
  onKitAccepted: (orderNumber: string) => void;
  onLogout: () => void;
  onFetchOrders: () => Promise<{ orders: RedemptionOrderSummary[]; creditAmount: number }>;
  onFetchTickets: () => Promise<{ items: StoreSupportTicket[] }>;
  onRaiseTicket: (body: {
    subject: string;
    description?: string;
    type?: string;
  }) => Promise<StoreSupportTicket>;
  onReplyTicket: (ticketId: string, body: string) => Promise<StoreSupportTicket>;
};

export function isKitCampaign(portal: PortalData | null) {
  return portal?.campaign?.type === "kit" || portal?.campaign?.type === "items";
}

/** Controller for the redemption portal: OTP gate + hand-off to store or kit-accept. */
export function useRedemptionController(token: string): RedemptionVm {
  const [step, setStep] = useState<RedemptionStep>("loading");
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [error, setError] = useState("");
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [kitData, setKitData] = useState<KitRedemptionData | null>(null);
  const [order, setOrder] = useState<{ orderNumber?: string; status?: string } | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const enterRedemption = useCallback(
    async (session: string, portalData: PortalData) => {
      if (isKitCampaign(portalData)) {
        const kit = await getRedemptionKit(token, session);
        setKitData(kit);
        setStep("kit");
        return;
      }
      const catalog = (await getRedemptionCatalog(token, session)) as { products: StoreProduct[] };
      setProducts(catalog.products || []);
      setStep("shop");
    },
    [token],
  );

  const loadPortal = useCallback(async () => {
    setStep("loading");
    setError("");
    try {
      const data = (await getRedemptionPortal(token)) as PortalData;
      setPortal(data);
      if (data.alreadyVerified && data.sessionToken) {
        setSessionToken(data.sessionToken);
        await enterRedemption(data.sessionToken, data);
        return;
      }
      setStep("portal");
    } catch (e) {
      if (e instanceof ApiError && e.code === "ALREADY_REDEEMED") {
        const track = await trackRedemption(token);
        setOrder(track as { orderNumber?: string; status?: string });
        setStep("track");
        return;
      }
      setError(e instanceof Error ? e.message : "Invalid redemption link");
      setStep("error");
    }
  }, [token, enterRedemption]);

  useEffect(() => {
    loadPortal();
  }, [loadPortal]);

  async function onSendOtp() {
    if (isSendingOtp) return;
    setError("");
    setIsSendingOtp(true);
    try {
      await sendRedemptionOtp(token, contact);
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send OTP");
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function onVerifyOtp() {
    if (isVerifyingOtp) return;
    setError("");
    setIsVerifyingOtp(true);
    try {
      const res = await verifyRedemptionOtp(token, otp);
      setSessionToken(res.sessionToken);
      if (portal) await enterRedemption(res.sessionToken, portal);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid OTP");
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  const onCheckout = useCallback(
    async (items: CheckoutItem[], shippingAddress: ShippingAddress, payment?: CheckoutPayment) => {
      const result = (await submitRedemption(
        token,
        sessionToken,
        {
          items,
          shippingAddress,
          paymentMode: payment?.mode ?? "points",
          razorpayPayment: payment?.razorpay,
        },
        `redeem-${token}-${Date.now()}`,
      )) as { orderNumber: string; remainingCredit?: number | null };
      if (result.remainingCredit != null && portal) {
        setPortal({
          ...portal,
          recipient: { ...portal.recipient, creditAmount: result.remainingCredit },
        });
      }
      return {
        orderNumber: result.orderNumber,
        remainingCredit: result.remainingCredit ?? undefined,
      };
    },
    [token, sessionToken, portal],
  );

  const onFetchOrders = useCallback(async () => {
    if (!sessionToken) return { orders: [], creditAmount: portal?.recipient.creditAmount ?? 0 };
    const data = await listRedemptionOrders(token, sessionToken);
    if (portal && data.creditAmount != null) {
      setPortal({
        ...portal,
        recipient: { ...portal.recipient, creditAmount: data.creditAmount },
      });
    }
    return data;
  }, [token, sessionToken, portal]);

  const onFetchTickets = useCallback(async () => {
    if (!sessionToken) return { items: [] };
    return listRedemptionTickets(token, sessionToken);
  }, [token, sessionToken]);

  const onRaiseTicket = useCallback(
    (body: { subject: string; description?: string; type?: string }) =>
      raiseRedemptionTicket(token, sessionToken, body),
    [token, sessionToken],
  );

  const onReplyTicket = useCallback(
    (ticketId: string, body: string) => replyRedemptionTicket(token, sessionToken, ticketId, body),
    [token, sessionToken],
  );

  function onLogout() {
    setSessionToken("");
    setProducts([]);
    setStep("portal");
    setError("");
  }

  return {
    step,
    portal,
    error,
    contact,
    otp,
    sessionToken,
    products,
    kitData,
    order,
    token,
    isKitFlow: isKitCampaign(portal),
    isSendingOtp,
    isVerifyingOtp,
    onContact: setContact,
    onOtp: setOtp,
    onSendOtp,
    onVerifyOtp,
    onCheckout,
    onKitAccepted: (orderNumber) => {
      setOrder({ orderNumber, status: "created" });
      setStep("track");
    },
    onLogout,
    onFetchOrders,
    onFetchTickets,
    onRaiseTicket,
    onReplyTicket,
  };
}
