import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  getRedemptionCatalog,
  getRedemptionKit,
  getRedemptionPortal,
  sendRedemptionOtp,
  submitRedemption,
  trackRedemption,
  verifyRedemptionOtp,
  type KitRedemptionData,
} from "@/services/api-bridge";
import type { StoreShop } from "@/components/StoreBanner";
import type { CheckoutItem, ShippingAddress, StoreProduct } from "@/components/store/StoreShell";

export type RedemptionStep = "loading" | "portal" | "otp" | "shop" | "kit" | "track" | "error";

type Shop = StoreShop & { currencyMode?: "points" | "inr" | "priceless" };

export type PortalData = {
  campaign: {
    name: string;
    type?: string;
    message?: { body?: string };
    shop?: Shop | null;
  };
  recipient: { name: string; creditAmount: number };
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
  onContact: (contact: string) => void;
  onOtp: (otp: string) => void;
  onSendOtp: () => void;
  onVerifyOtp: () => void;
  onCheckout: (
    items: CheckoutItem[],
    shippingAddress: ShippingAddress,
  ) => Promise<{ orderNumber: string }>;
  onKitAccepted: (orderNumber: string) => void;
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
    setError("");
    try {
      await sendRedemptionOtp(token, contact);
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send OTP");
    }
  }

  async function onVerifyOtp() {
    setError("");
    try {
      const res = await verifyRedemptionOtp(token, otp);
      setSessionToken(res.sessionToken);
      if (portal) await enterRedemption(res.sessionToken, portal);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid OTP");
    }
  }

  const onCheckout = useCallback(
    async (items: CheckoutItem[], shippingAddress: ShippingAddress) => {
      const result = (await submitRedemption(
        token,
        sessionToken,
        { items, shippingAddress },
        `redeem-${token}-${Date.now()}`,
      )) as { orderNumber: string };
      return { orderNumber: result.orderNumber };
    },
    [token, sessionToken],
  );

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
    onContact: setContact,
    onOtp: setOtp,
    onSendOtp,
    onVerifyOtp,
    onCheckout,
    onKitAccepted: (orderNumber) => {
      setOrder({ orderNumber, status: "created" });
      setStep("track");
    },
  };
}
