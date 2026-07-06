import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { type StoreShop } from "../StoreBanner";
import { resolveColorHex } from "@/lib/colorMap";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { shopBannerPresetLabel, shopHeroBannerUrl } from "@/lib/shop-banners";
import {
  DesignedProductThumb,
  storeProductAsUi,
} from "@/features/swag/DesignedProductThumb";
import { POINT_VALUE } from "@/features/send/money";
import { createRedemptionRazorpayOrder } from "@/services/api-bridge";
import { openRazorpayCheckout } from "@/lib/razorpay";
import walletIconImg from "../../../assets/wallet-icon.svg";
import { StoreAccountMenu, type StoreOrderSummary } from "./StoreAccountMenu";
import { StoreEmptyState } from "./StoreEmptyState";
import { StorePageShell } from "./StorePageShell";

type PrintArea = {
  key?: string;
  label?: string;
  mockupImageUrl?: string;
  box: { xPct: number; yPct: number; widthPct: number; heightPct: number };
};

export type StoreProduct = {
  _id: string;
  catalogProductId?: string;
  collectionId?: string;
  name: string;
  brand?: string;
  group?: string;
  category?: string;
  description?: string;
  keyFeatures?: string;
  sizeGuide?: string;
  basePriceInr: number;
  primaryImageUrl?: string;
  imageUrls?: string[];
  maskImageUrl?: string;
  baseImageUrl?: string;
  artworkUrl?: string;
  /** Pre-baked design mockup (mask + artwork flattened) — shown as-is when set. */
  mockupUrl?: string;
  preferredColors?: string[];
  printAreas?: PrintArea[];
  variants?: Array<{ size?: string; color?: string; colorHex?: string; material?: string; sku?: string }>;
};

function variantColorNames(p: StoreProduct) {
  return distinct(p.variants?.map((v) => v.color) ?? []);
}

function distinct(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter((v): v is string => !!v)));
}

function isWhiteColor(name: string) {
  return name.toLowerCase().trim() === "white";
}

function sortColorsWhiteFirst(colors: Array<{ name: string; hex: string }>) {
  const whiteIdx = colors.findIndex((c) => isWhiteColor(c.name));
  if (whiteIdx <= 0) return colors;
  const sorted = [...colors];
  const [white] = sorted.splice(whiteIdx, 1);
  return [white, ...sorted];
}

/** White is always the primary/default colour option for mockup preview. */
function ensureWhitePrimary(colors: Array<{ name: string; hex: string }>) {
  if (colors.some((c) => isWhiteColor(c.name))) return sortColorsWhiteFirst(colors);
  return [{ name: "White", hex: "#FFFFFF" }, ...colors];
}

function primaryColorIndex(_colors: Array<{ name: string; hex: string }>) {
  return 0;
}

function productColorOptions(p: StoreProduct): Array<{ name: string; hex: string }> {
  const available = variantColorNames(p);
  const prefs = p.preferredColors || [];
  const names = prefs.length ? prefs.filter((c) => !available.length || available.includes(c)) : available;
  const finalNames = names.length ? names : available;
  return ensureWhitePrimary(
    finalNames.map((name) => ({
      name,
      hex: resolveColorHex(name, p.variants?.find((v) => v.color === name)?.colorHex),
    })),
  );
}

function ArtworkMockup({ product, className, style }: { product: StoreProduct; className?: string; style?: CSSProperties }) {
  const ui = storeProductAsUi(product);
  if (!ui.imgUrl && !ui.mockupUrl && !product.artworkUrl) {
    return (
      <div className={className} style={{ display: "grid", placeItems: "center", height: "100%", ...style }}>
        <span className="mut3" style={{ fontSize: 12 }}>No image</span>
      </div>
    );
  }
  return (
    <DesignedProductThumb
      product={ui}
      artworkUrl={product.artworkUrl}
      className={className}
      style={style}
    />
  );
}

function ColorSwatches({
  colors,
  selected,
  onSelect,
  size = "md",
}: {
  colors: Array<{ name: string; hex: string }>;
  selected: number;
  onSelect: (index: number) => void;
  size?: "sm" | "md";
}) {
  if (!colors.length) return null;
  const btnClass = size === "sm" ? "sw" : "pd-sw";
  return (
    <div className={size === "sm" ? "swatches" : "pd-swatches"}>
      {colors.map((c, i) => (
        <button
          key={c.name}
          type="button"
          className={`${btnClass} ${i === selected ? "on" : ""}`}
          style={{ background: c.hex }}
          onClick={() => onSelect(i)}
          title={c.name}
        />
      ))}
    </div>
  );
}

export type CheckoutItem = { productId: string; qty: number; variant?: { size?: string; color?: string } };
export type CheckoutPayment = {
  mode: "points" | "points_upi" | "upi";
  razorpay?: {
    orderId: string;
    paymentId: string;
    signature: string;
  };
};
export type ShippingAddress = {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
};

type AddedToBagInfo = {
  name: string;
  brand: string;
  linePriceInr: number;
  qty: number;
  image?: string;
};

type Mode = "preview" | "redeem";
type Page = "home" | "products" | "product" | "cart" | "checkout" | "done" | "orders";

type CartLine = {
  key: string;
  productId: string;
  name: string;
  brand?: string;
  priceInr: number;
  qty: number;
  variant?: { size?: string; color?: string };
  image?: string;
};

const CART_STORAGE_PREFIX = "shelf-merch:cart:v1:";

function cartStorageKey(persistId?: string) {
  return persistId ? `${CART_STORAGE_PREFIX}${persistId}` : null;
}

function readStoredCart(key: string): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line): line is CartLine =>
        !!line &&
        typeof line === "object" &&
        typeof (line as CartLine).key === "string" &&
        typeof (line as CartLine).productId === "string" &&
        typeof (line as CartLine).qty === "number" &&
        (line as CartLine).qty > 0,
    );
  } catch {
    return [];
  }
}

function reconcileCartLines(lines: CartLine[], products: StoreProduct[], shopName: string): CartLine[] {
  if (!products.length) return lines;
  return lines
    .filter((line) => products.some((p) => p._id === line.productId))
    .map((line) => {
      const product = products.find((p) => p._id === line.productId);
      if (!product) return line;
      return {
        ...line,
        name: product.name,
        brand: product.brand || shopName,
        priceInr: product.basePriceInr,
        image: storeProductThumb(product),
      };
    });
}

function persistStoredCart(key: string, cart: CartLine[]) {
  if (typeof window === "undefined") return;
  try {
    if (cart.length === 0) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(cart));
  } catch {
    // Private mode / quota — cart still works for this session.
  }
}

function productImage(p: StoreProduct) {
  return resolveMediaUrl(p.primaryImageUrl || p.imageUrls?.[0] || p.maskImageUrl || "");
}

function storeProductThumb(p: StoreProduct) {
  return resolveMediaUrl(p.mockupUrl) || productImage(p);
}

/* ─── SVG Icons (inline for zero dependencies) ─── */
function ShelfMerchLogo() {
  return (
    <svg viewBox="0 0 32 32" fill="none">
      <path d="M16 2L4 8v16l12 6 12-6V8L16 2z" fill="currentColor" opacity=".15" />
      <path d="M16 2L4 8v16l12 6 12-6V8L16 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      <path d="M4 8l12 6 12-6M16 14v16" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="16" cy="14" r="3" fill="currentColor" opacity=".3" />
    </svg>
  );
}

function PointsIcon() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" style={{ flex: "none" }}>
      <circle cx="12" cy="12" r="10" opacity=".15" /><path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z" /><path d="M15.09 11.41l-2.59-1.5V7a.5.5 0 00-1 0v3.18a.5.5 0 00.25.43l2.84 1.64a.5.5 0 00.5-.87z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function ShoppingBagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M12 8v13M3 12h18M12 8c-2-2.5-5-3-5 0s3 2 5 0 5-2.5 5 0-3-3-5 0" />
    </svg>
  );
}

function PlayCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className || "topbar-chevron"}
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 18V6a2 2 0 00-2-2H4a2 2 0 00-2 2v11a1 1 0 001 1h2" />
      <path d="M15 18h2" />
      <path d="M19 18h2v-3.34a1 1 0 00-.76-.97L16.5 12.5" />
      <path d="M16 18H6" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </svg>
  );
}

function truncTopbarName(name: string, max = 8) {
  const n = name.trim();
  return n.length > max ? `${n.slice(0, max - 1)}…` : n;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function StoreShell({
  shop,
  products,
  mode,
  currency = "inr",
  creditInr,
  recipientName,
  recipientEmail,
  welcome,
  redemptionToken,
  sessionToken,
  cartPersistId,
  onCheckout,
  onLogout,
  onFetchOrders,
}: {
  shop: StoreShop;
  products: StoreProduct[];
  mode: Mode;
  currency?: "points" | "inr" | "priceless";
  creditInr?: number;
  recipientName?: string;
  recipientEmail?: string;
  welcome?: string;
  redemptionToken?: string;
  sessionToken?: string;
  /** Scope cart persistence across page refreshes (redemption token or shop id). */
  cartPersistId?: string;
  onCheckout?: (
    items: CheckoutItem[],
    address: ShippingAddress,
    payment?: CheckoutPayment,
  ) => Promise<{
    orderNumber: string;
    remainingCredit?: number;
  }>;
  onLogout?: () => void;
  onFetchOrders?: () => Promise<{ orders: StoreOrderSummary[]; creditAmount: number }>;
}) {
  const storageKey = cartStorageKey(cartPersistId);
  const [page, setPage] = useState<Page>("home");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>(() => (storageKey ? readStoredCart(storageKey) : []));
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [balanceInr, setBalanceInr] = useState(creditInr);
  const [orders, setOrders] = useState<StoreOrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [address, setAddress] = useState<ShippingAddress>({
    name: recipientName || "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
    country: "IN",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [scrolled, setScrolled] = useState(false);
  const [checkoutFirst, setCheckoutFirst] = useState("");
  const [checkoutLast, setCheckoutLast] = useState("");
  const [checkoutBusiness, setCheckoutBusiness] = useState("");
  const [addressSaved, setAddressSaved] = useState(false);
  const [shippingConfirmed, setShippingConfirmed] = useState(false);
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const [useRewardPoints, setUseRewardPoints] = useState(true);
  const [addedToBag, setAddedToBag] = useState<AddedToBagInfo | null>(null);
  const catalogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBalanceInr(creditInr);
  }, [creditInr]);

  useEffect(() => {
    if (!storageKey || products.length === 0) return;
    setCart((prev) => reconcileCartLines(prev.length ? prev : readStoredCart(storageKey), products, shop.name));
  }, [storageKey, products, shop.name]);

  useEffect(() => {
    if (!storageKey) return;
    persistStoredCart(storageKey, cart);
  }, [storageKey, cart]);

  useEffect(() => {
    if (page === "orders") void refreshOrders();
  }, [page]);

  useEffect(() => {
    if (page === "cart" && cart.length === 0) {
      setPage("products");
    }
  }, [page, cart.length]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [page]);

  useEffect(() => {
    if (!addedToBag) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAddedToBag(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addedToBag]);

  useEffect(() => {
    if (page !== "checkout") {
      setAddressSaved(false);
      setShippingConfirmed(false);
      setItemsExpanded(false);
      return;
    }
    const full = (address.name || recipientName || "").trim();
    if (!full) return;
    const parts = full.split(/\s+/);
    setCheckoutFirst(parts[0] || "");
    setCheckoutLast(parts.slice(1).join(" ") || "");
  }, [page, recipientName, address.name]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const active = products.find((p) => p._id === activeId) || null;
  const cartCount = cart.reduce((n, l) => n + l.qty, 0);
  const cartTotalInr = cart.reduce((n, l) => n + l.priceInr * l.qty, 0);
  const usesPointsDisplay = currency === "points" || (mode === "redeem" && currency !== "priceless");
  const pointsAvailable = balanceInr ?? 0;
  const pointsApplied = useRewardPoints ? Math.min(pointsAvailable, cartTotalInr) : 0;
  const upiDueInr = useRewardPoints ? Math.max(0, cartTotalInr - pointsApplied) : cartTotalInr;
  const hasEnoughPoints = balanceInr != null && cartTotalInr <= balanceInr;
  const paysWithUpi = mode === "redeem" && upiDueInr > 0;
  const canCheckout = mode !== "redeem" || cart.length > 0;

  function inrToPoints(inr: number) {
    return Math.round(inr / POINT_VALUE);
  }

  function fmt(inr: number) {
    if (currency === "priceless") return "Gift";
    if (usesPointsDisplay) return `${inrToPoints(inr).toLocaleString("en-IN")} pts`;
    return `₹${inr.toLocaleString("en-IN")}`;
  }

  /** Stadium-style product price — bold "Pts" or ₹ on cards. */
  function fmtCardPrice(inr: number) {
    if (currency === "priceless") return "Gift";
    if (usesPointsDisplay) return `${inrToPoints(inr).toLocaleString("en-IN")} Pts`;
    return `₹${inr.toLocaleString("en-IN")}`;
  }

  function navBalanceLabel() {
    if (currency === "priceless") return "Your gift";
    if (usesPointsDisplay) return "Points";
    return mode === "redeem" ? "Points" : "You pay";
  }

  function navBalanceValue(inr: number) {
    if (currency === "priceless") return "Gift";
    if (usesPointsDisplay) return `${inrToPoints(inr).toLocaleString("en-IN")} Pts`;
    return `₹${inr.toLocaleString("en-IN")}`;
  }

  function fmtUpiAmount(inr: number) {
    return `₹${inr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  async function collectRazorpayPayment(amountInr: number) {
    if (!redemptionToken || !sessionToken) {
      throw new Error("Payment session expired — refresh and try again.");
    }
    const order = await createRedemptionRazorpayOrder(redemptionToken, sessionToken, amountInr);
    const response = await new Promise<{
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }>((resolve, reject) => {
      void openRazorpayCheckout({
        order: { ...order, walletId: order.paymentId },
        description: `Pay ${fmtUpiAmount(amountInr)} via UPI`,
        onSuccess: resolve,
        onDismiss: () => reject(new Error("Payment cancelled")),
      }).catch(reject);
    });
    return {
      orderId: response.razorpay_order_id,
      paymentId: response.razorpay_payment_id,
      signature: response.razorpay_signature,
    };
  }

  function fmtCheckoutInr(inr: number) {
    return `INR ${inr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function checkoutPaymentMode(): CheckoutPayment["mode"] {
    if (!useRewardPoints) return "upi";
    if (hasEnoughPoints) return "points";
    return "points_upi";
  }

  function resetCheckoutProgress() {
    setAddressSaved(false);
    setShippingConfirmed(false);
  }

  function buildAddressFromCheckout(): ShippingAddress {
    return {
      ...address,
      name: [checkoutFirst, checkoutLast].filter(Boolean).join(" ").trim(),
    };
  }

  function saveShipping() {
    const next = buildAddressFromCheckout();
    const missing = (["name", "phone", "line1", "city", "state", "pincode"] as const).filter(
      (k) => !(k === "name" ? next.name : next[k]).trim(),
    );
    if (missing.length) {
      setError("Please complete all required shipping fields.");
      return;
    }
    setAddress(next);
    setError("");
    setAddressSaved(true);
  }

  function confirmShipping() {
    if (!addressSaved) return;
    setShippingConfirmed(true);
  }

  function openProduct(id: string) {
    setActiveId(id);
    setPage("product");
  }

  function browseRewards() {
    setPage("products");
  }

  function goHowItWorks() {
    const scroll = () => catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (page !== "home") {
      setPage("home");
      window.setTimeout(scroll, 80);
    } else {
      scroll();
    }
  }

  function onHeaderSearch(q: string) {
    setSearchQuery(q);
    const trimmed = q.trim();
    if (trimmed && page !== "products" && page !== "product") {
      setPage("products");
    }
  }

  function addToCart(p: StoreProduct, variant: { size?: string; color?: string }, qty: number) {
    const key = `${p._id}|${variant.size || ""}|${variant.color || ""}`;
    const existing = cart.find((l) => l.key === key);
    const next = existing
      ? cart.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
      : [
          ...cart,
          {
            key,
            productId: p._id,
            name: p.name,
            brand: p.brand || shop.name,
            priceInr: p.basePriceInr,
            qty,
            variant: variant.size || variant.color ? variant : undefined,
            image: storeProductThumb(p),
          },
        ];
    setCart(next);
    setAddedToBag({
      name: p.name,
      brand: p.brand || shop.name,
      linePriceInr: p.basePriceInr * qty,
      qty,
      image: storeProductThumb(p),
    });
  }

  function closeAddedToBag() {
    setAddedToBag(null);
  }

  function viewBagFromModal() {
    setAddedToBag(null);
    setPage("cart");
  }

  function checkoutFromModal() {
    setAddedToBag(null);
    setPage("checkout");
  }

  function setLineQty(key: string, qty: number) {
    setCart((prev) =>
      qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty } : l)),
    );
  }

  function bumpLineQty(key: string, delta: number) {
    const line = cart.find((l) => l.key === key);
    if (!line) return;
    setLineQty(key, line.qty + delta);
  }

  function clearCart() {
    setCart([]);
  }

  function editCartLine(productId: string) {
    setActiveId(productId);
    setPage("product");
  }

  async function refreshOrders() {
    if (!onFetchOrders) return;
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const data = await onFetchOrders();
      setOrders(data.orders);
      if (data.creditAmount != null) setBalanceInr(data.creditAmount);
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : "Could not load orders");
    } finally {
      setOrdersLoading(false);
    }
  }

  function openCart() {
    if (cart.length === 0) {
      setPage("products");
      return;
    }
    setPage("cart");
  }

  function continueShopping() {
    setCart([]);
    setOrderNumber("");
    setError("");
    setPage("home");
    void refreshOrders();
  }

  async function placeOrder() {
    setError("");
    const next = buildAddressFromCheckout();
    setAddress(next);
    const missing = (["name", "phone", "line1", "city", "state", "pincode"] as const).filter(
      (k) => !(k === "name" ? next.name : next[k]).trim(),
    );
    if (missing.length) {
      setError("Please complete your shipping details (name, phone and full address).");
      return;
    }
    if (!onCheckout) return;
    setPlacing(true);
    try {
      const items: CheckoutItem[] = cart.map((l) => ({ productId: l.productId, qty: l.qty, variant: l.variant }));
      const paymentMode = checkoutPaymentMode();
      let razorpay: CheckoutPayment["razorpay"];

      if (mode === "redeem" && upiDueInr > 0) {
        razorpay = await collectRazorpayPayment(upiDueInr);
      }

      const res = await onCheckout(items, next, { mode: paymentMode, razorpay });
      setOrderNumber(res.orderNumber);
      if (res.remainingCredit != null) setBalanceInr(res.remainingCredit);
      setCart([]);
      setPage("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not place your order");
    } finally {
      setPlacing(false);
    }
  }

  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q),
    );
  }, [products, searchQuery]);

  const userInitials = recipientName
    ? recipientName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "SM";
  const displayName = truncTopbarName(recipientName || (mode === "preview" ? "Preview" : "Guest"));
  const workspaceLabel = shop.name.toLowerCase();

  const heroBannerUrl = shopHeroBannerUrl(shop) || "/images/hero-banner.png";
  const heroBannerLabel =
    shopBannerPresetLabel(shop.bannerPreset) || "Feliz Dia de los Muertos";

  /* ─── RENDER ─── */
  return (
    <div className="sf-root">
      {/* Preview mode strip */}
      {mode === "preview" && (
        <div className="sf-preview-strip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          Employees: open your private invite link to redeem your gift.
        </div>
      )}

      {/* ═══ TOP NAV ═══ */}
      <div className={`sf-topbar${scrolled ? " scrolled" : ""}`}>
        <div className="sf-topbar-inner sf-topbar-inner--stadium">
          <button type="button" className="sf-shopbrand sf-shopbrand--compact" onClick={() => setPage("home")}>
            <div className="sf-shopbrand-logo">
              {shop.logoUrl ? (
                <img src={shop.logoUrl} alt={shop.name} />
              ) : (
                <span>{shop.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="sf-shopbrand-text">
              <span className="sf-shopbrand-name">{shop.name}</span>
              <span className="sf-shopbrand-sub">Rewards store</span>
            </span>
          </button>

          <div className="sf-topbar-search">
            <input
              type="search"
              className="sf-topbar-search-input"
              placeholder="Search all products"
              value={searchQuery}
              onChange={(e) => onHeaderSearch(e.target.value)}
              aria-label="Search all products"
            />
          </div>

          <div className="sf-topbar-right sf-topbar-right--stadium">
            {mode === "redeem" && balanceInr != null && (
              <button
                type="button"
                className="topbar-wallet sf-topbar-wallet"
                aria-label={currency === "points" || (mode === "redeem" && currency === "inr") ? "Your points balance" : "Available balance"}
                onClick={() => setPage("home")}
              >
                <span className="topbar-wallet-icon">
                  <img src={walletIconImg} alt="" className="topbar-wallet-img" aria-hidden="true" />
                </span>
                <span className="topbar-wallet-copy">
                  <span className="k">{navBalanceLabel()}</span>
                  <span className="v">{navBalanceValue(balanceInr)}</span>
                </span>
              </button>
            )}

            {mode === "redeem" && onLogout ? (
              <StoreAccountMenu
                recipientName={recipientName || "Guest"}
                recipientEmail={recipientEmail}
                shopName={shop.name}
                initials={userInitials}
                truncName={displayName}
                balanceLabel={navBalanceLabel()}
                balanceValue={balanceInr != null ? navBalanceValue(balanceInr) : "—"}
                orders={orders}
                ordersLoading={ordersLoading}
                onOpenOrders={() => {
                  setPage("orders");
                  void refreshOrders();
                }}
                onLogout={onLogout}
                onRefreshOrders={() => void refreshOrders()}
              />
            ) : (
            <button type="button" className="topbar-user sf-topbar-user" aria-label="Account">
              <span className="topbar-user-avatar">{userInitials}</span>
              <span className="topbar-user-copy">
                <span className="topbar-user-name">{displayName}</span>
                <span className="topbar-user-sub">{workspaceLabel}</span>
              </span>
              <ChevronDown className="topbar-chevron sf-topbar-user-chevron" />
            </button>
            )}

            {mode === "redeem" && (
              <button
                type="button"
                className="sf-topbar-cart"
                onClick={openCart}
                aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
              >
                <ShoppingBagIcon />
                {cartCount > 0 ? <span className="sf-topbar-cart-badge">{cartCount}</span> : null}
              </button>
            )}
          </div>
        </div>
      </div>

      {addedToBag ? (
        <>
          <button
            type="button"
            className="sf-bag-added-scrim"
            aria-label="Close"
            onClick={closeAddedToBag}
          />
          <div
            className="sf-bag-added"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sf-bag-added-title"
          >
            <div className="sf-bag-added-panel">
              <div className="sf-bag-added-head">
                <div className="sf-bag-added-head-left">
                  <span className="sf-bag-added-check" aria-hidden="true">
                    <CheckCircleIcon />
                  </span>
                  <h2 id="sf-bag-added-title" className="sf-bag-added-title">
                    Added to bag
                  </h2>
                </div>
                <button
                  type="button"
                  className="sf-bag-added-close"
                  aria-label="Close"
                  onClick={closeAddedToBag}
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="sf-bag-added-item">
                <div className="sf-bag-added-item-img">
                  {addedToBag.image ? <img src={addedToBag.image} alt="" /> : null}
                </div>
                <div className="sf-bag-added-item-body">
                  <div className="sf-bag-added-item-brand">{addedToBag.brand.toUpperCase()}</div>
                  <div className="sf-bag-added-item-name">{addedToBag.name}</div>
                  <div className="sf-bag-added-item-qty">QTY: {addedToBag.qty}</div>
                </div>
                <div className="sf-bag-added-item-price">{fmtCardPrice(addedToBag.linePriceInr)}</div>
              </div>

              <div className="sf-bag-added-actions">
                <button type="button" className="sf-bag-added-view" onClick={viewBagFromModal}>
                  View bag ({cartCount})
                </button>
                <button type="button" className="sf-bag-added-checkout" onClick={checkoutFromModal}>
                  Checkout
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* ═══ MAIN CONTENT ═══ */}

      {error && page !== "checkout" && (
        <div className="sf-content" style={{ paddingTop: 16 }}>
          <div className="card" style={{ padding: 12, color: "var(--danger)" }}>{error}</div>
        </div>
      )}

      {/* ────── HOME ────── */}
      {page === "home" && (
        <>
          {/* Hero banner */}
          <div className="sf-hero-banner">
            <div className="sf-hero-banner-frame">
              <img
                src={heroBannerUrl}
                alt={heroBannerLabel}
                className="sf-hero-banner-img"
                loading="eager"
                decoding="async"
              />
              <div className="sf-hero-banner-overlay" aria-hidden="false">
                <div className="sf-hero-banner-actions">
                  <button type="button" className="sf-hero-banner-btn sf-hero-banner-btn-primary" onClick={browseRewards}>
                    <GiftIcon />
                    Browse Rewards
                  </button>
                  <button type="button" className="sf-hero-banner-btn sf-hero-banner-btn-secondary" onClick={goHowItWorks}>
                    <PlayCircleIcon />
                    How it works
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Catalog */}
          <div className="sf-content" ref={catalogRef}>
            {products.length > 0 ? (
              <>
                <div className="sf-section-header sf-section-header--stadium">
                  <h2 className="sf-section-title sf-section-title--stadium">Featured Products</h2>
                  {products.length > 5 ? (
                    <button type="button" className="sf-view-all" onClick={() => setPage("products")}>
                      View all <ArrowRightIcon />
                    </button>
                  ) : null}
                </div>
                <StadiumProductGrid
                  products={filteredBySearch.slice(0, 5)}
                  shopBrand={shop.name}
                  onOpen={openProduct}
                  priceLabel={fmtCardPrice}
                />
                {products.length > 5 ? (
                  <>
                    <div className="sf-section-header sf-section-header--stadium" style={{ marginTop: 48 }}>
                      <h2 className="sf-section-title sf-section-title--stadium">All Products</h2>
                      <p className="sf-section-subtitle sf-section-subtitle--stadium">
                        {products.length} items available
                      </p>
                    </div>
                    <StadiumProductGrid
                      products={filteredBySearch.slice(5)}
                      shopBrand={shop.name}
                      onOpen={openProduct}
                      priceLabel={fmtCardPrice}
                    />
                  </>
                ) : null}
              </>
            ) : (
              <StoreEmptyState
                variant="search"
                title="No products yet"
                description="Your reward catalog will appear here once products are added to this shop."
              />
            )}
          </div>
        </>
      )}

      {/* ────── PRODUCTS ────── */}
      {page === "products" && (
        <div className="sf-content" style={{ paddingTop: 8 }}>
          <div className="sf-section-header sf-section-header--stadium" style={{ paddingTop: 20 }}>
            <h1 className="sf-section-title sf-section-title--stadium">All Products</h1>
          </div>
          <ProductsPageWithFilters
            products={products}
            searchQuery={searchQuery}
            onOpen={openProduct}
            priceLabel={fmtCardPrice}
            shopBrand={shop.name}
            selectedCategory={selectedCategory}
          />
        </div>
      )}

      {/* ────── PRODUCT DETAIL ────── */}
      {page === "product" && active && (
        <div className="sf-content sf-pdp-page">
          <ProductDetail
            product={active}
            mode={mode}
            priceLabel={fmtCardPrice}
            onBack={() => setPage("products")}
            onAdd={(variant, qty) => addToCart(active, variant, qty)}
          />
        </div>
      )}

      {/* ────── CART ────── */}
      {page === "cart" && cart.length > 0 && (
        <div className="sf-content sf-bag-page">
          <button type="button" className="sf-bag-back" onClick={() => setPage("home")}>
            ← CONTINUE SHOPPING
          </button>

          <div className="sf-bag-layout">
            <div className="sf-bag-main">
              <h1 className="sf-bag-title">My Bag ({cartCount})</h1>

              {mode === "redeem" && balanceInr != null ? (
                <div className={`sf-bag-funds${useRewardPoints ? "" : " sf-bag-funds--off"}`}>
                  <div className="sf-bag-funds-label">My Reward Points</div>
                  <label className="sf-bag-funds-wallet">
                    <input
                      type="checkbox"
                      checked={useRewardPoints}
                      onChange={(e) => setUseRewardPoints(e.target.checked)}
                    />
                    <span>
                      {recipientName ? `${recipientName}'s ` : ""}
                      {shop.name} Wallet
                    </span>
                  </label>
                  <div className="sf-bag-funds-balance">
                    Available: <b>{navBalanceValue(balanceInr)}</b>
                  </div>
                  {!useRewardPoints ? (
                    <p className="sf-bag-funds-hint">Pay at checkout via UPI, cards, or net banking.</p>
                  ) : !hasEnoughPoints ? (
                    <p className="sf-bag-funds-warning">
                      Insufficient points — remaining balance can be paid via UPI at checkout.
                    </p>
                  ) : (
                    <p className="sf-bag-funds-hint">Reward points will be applied at checkout.</p>
                  )}
                </div>
              ) : null}

              <div className="sf-bag-items">
                {cart.map((l) => {
                  const variantLabel = [l.variant?.size, l.variant?.color].filter(Boolean).join(" · ");
                  return (
                    <div key={l.key} className="sf-bag-item">
                      <div className="sf-bag-item-img">
                        {l.image ? <img src={l.image} alt={l.name} /> : null}
                      </div>
                      <div className="sf-bag-item-body">
                        <div className="sf-bag-item-brand">{(l.brand || shop.name).toUpperCase()}</div>
                        <div className="sf-bag-item-name">{l.name}</div>
                        {variantLabel ? <span className="sf-bag-item-tag">{variantLabel.toUpperCase()}</span> : null}
                        <div className="sf-bag-item-price">{fmtCardPrice(l.priceInr * l.qty)}</div>
                        <div className="sf-bag-item-actions">
                          <div className="sf-bag-qty">
                            <button
                              type="button"
                              className="sf-bag-qty-btn"
                              aria-label="Decrease quantity"
                              onClick={() => bumpLineQty(l.key, -1)}
                            >
                              <MinusIcon />
                            </button>
                            <span className="sf-bag-qty-val">{l.qty}</span>
                            <button
                              type="button"
                              className="sf-bag-qty-btn"
                              aria-label="Increase quantity"
                              onClick={() => bumpLineQty(l.key, 1)}
                            >
                              <PlusIcon />
                            </button>
                          </div>
                          <button
                            type="button"
                            className="sf-bag-icon-btn"
                            aria-label="Edit item"
                            onClick={() => editCartLine(l.productId)}
                          >
                            <PencilIcon />
                          </button>
                          <button
                            type="button"
                            className="sf-bag-icon-btn sf-bag-icon-btn--danger"
                            aria-label="Remove item"
                            onClick={() => setLineQty(l.key, 0)}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button type="button" className="sf-bag-remove-all" onClick={clearCart}>
                Remove all items
              </button>
            </div>

            <aside className="sf-bag-sidebar">
              <div className="sf-bag-summary">
                <h2 className="sf-bag-summary-title">Order Summary</h2>
                <div className="sf-bag-summary-row">
                  <span>Bag total</span>
                  <b>{fmtCardPrice(cartTotalInr)}</b>
                </div>
                <div className="sf-bag-summary-row sf-bag-summary-row--muted">
                  <span>Estimated taxes</span>
                  <b>TBD</b>
                </div>
                {mode === "redeem" && balanceInr != null && useRewardPoints && pointsApplied > 0 ? (
                  <div className="sf-bag-summary-row sf-bag-summary-row--muted">
                    <span>Points applied</span>
                    <b>{fmtCardPrice(pointsApplied)}</b>
                  </div>
                ) : null}
                {mode === "redeem" && paysWithUpi ? (
                  <div className="sf-bag-summary-row sf-bag-summary-row--muted">
                    <span>Pay via UPI</span>
                    <b>{fmtUpiAmount(upiDueInr)}</b>
                  </div>
                ) : null}
                {mode === "redeem" && balanceInr != null && useRewardPoints && hasEnoughPoints ? (
                  <div className="sf-bag-summary-row sf-bag-summary-row--muted">
                    <span>Remaining after order</span>
                    <b>{fmtCardPrice(Math.max(0, balanceInr - cartTotalInr))}</b>
                  </div>
                ) : null}
                <div className="sf-bag-summary-total">
                  <span>{paysWithUpi ? "You pay" : navBalanceLabel()}</span>
                  <b>
                    {paysWithUpi
                      ? fmtUpiAmount(upiDueInr)
                      : canCheckout
                        ? fmtCardPrice(cartTotalInr)
                        : "—"}
                  </b>
                </div>
                {mode === "redeem" ? (
                  <>
                    <button
                      type="button"
                      className="sf-bag-checkout-btn"
                      disabled={!canCheckout}
                      onClick={() => setPage("checkout")}
                    >
                      Proceed to checkout
                    </button>
                  </>
                ) : (
                  <p className="sf-bag-preview-note">Open your invite link to check out.</p>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* ────── CHECKOUT ────── */}
      {page === "checkout" && (
        <div className="sf-content sf-checkout-page">
          <button type="button" className="sf-bag-back" onClick={() => setPage("cart")}>
            ← BACK
          </button>

          <div className="sf-checkout-titlebar">
            <h1 className="sf-checkout-title">Checkout</h1>
            <div className="sf-checkout-currency" aria-label="Currency">
              {usesPointsDisplay ? "Pts" : "INR"}
              <ChevronDown className="sf-checkout-currency-chevron" />
            </div>
          </div>

          {error ? <div className="sf-checkout-error">{error}</div> : null}

          <div className="sf-checkout-layout">
            <div className="sf-checkout-main">
              <div className="sf-checkout-shipping-card">
                <div className="sf-checkout-section-head">
                  <TruckIcon />
                  <span>Shipping</span>
                </div>
                <h2 className="sf-checkout-subhead">— Add new address</h2>

                <div className="sf-checkout-form">
                  <div className="sf-checkout-form-row sf-checkout-form-row--2">
                    <label className="sf-checkout-field">
                      <span className="sf-checkout-label">First name</span>
                      <input
                        className="sf-checkout-inp"
                        value={checkoutFirst}
                        onChange={(e) => {
                          setCheckoutFirst(e.target.value);
                          resetCheckoutProgress();
                        }}
                      />
                    </label>
                    <label className="sf-checkout-field">
                      <span className="sf-checkout-label">Last name</span>
                      <input
                        className="sf-checkout-inp"
                        value={checkoutLast}
                        onChange={(e) => {
                          setCheckoutLast(e.target.value);
                          resetCheckoutProgress();
                        }}
                      />
                    </label>
                  </div>

                  <label className="sf-checkout-field">
                    <span className="sf-checkout-label">Business name (optional)</span>
                    <input
                      className="sf-checkout-inp"
                      placeholder="Company name"
                      value={checkoutBusiness}
                      onChange={(e) => {
                        setCheckoutBusiness(e.target.value);
                        resetCheckoutProgress();
                      }}
                    />
                  </label>

                  <div className="sf-checkout-form-row sf-checkout-form-row--2">
                    <label className="sf-checkout-field">
                      <span className="sf-checkout-label">Country</span>
                      <select
                        className="sf-checkout-inp sf-checkout-select"
                        value={address.country || "IN"}
                        onChange={(e) => {
                          setAddress({ ...address, country: e.target.value });
                          resetCheckoutProgress();
                        }}
                      >
                        <option value="IN">India</option>
                        <option value="US">United States</option>
                      </select>
                    </label>
                    <label className="sf-checkout-field">
                      <span className="sf-checkout-label">Phone number</span>
                      <div className="sf-checkout-phone">
                        <span className="sf-checkout-phone-prefix">
                          {address.country === "US" ? "+1" : "+91"}
                        </span>
                        <input
                          className="sf-checkout-inp sf-checkout-inp--phone"
                          placeholder={address.country === "US" ? "(555) 555-5555" : "98765 43210"}
                          value={address.phone}
                          onChange={(e) => {
                            setAddress({ ...address, phone: e.target.value });
                            resetCheckoutProgress();
                          }}
                        />
                      </div>
                    </label>
                  </div>

                  <label className="sf-checkout-field">
                    <span className="sf-checkout-label">Address</span>
                    <input
                      className="sf-checkout-inp"
                      placeholder="Street address"
                      value={address.line1}
                      onChange={(e) => {
                        setAddress({ ...address, line1: e.target.value });
                        resetCheckoutProgress();
                      }}
                    />
                  </label>

                  <div className="sf-checkout-form-row sf-checkout-form-row--2">
                    <label className="sf-checkout-field">
                      <span className="sf-checkout-label">Suite / Apt / Other</span>
                      <input
                        className="sf-checkout-inp"
                        placeholder="Apt 000"
                        value={address.line2 || ""}
                        onChange={(e) => {
                          setAddress({ ...address, line2: e.target.value });
                          resetCheckoutProgress();
                        }}
                      />
                    </label>
                    <label className="sf-checkout-field">
                      <span className="sf-checkout-label">City</span>
                      <input
                        className="sf-checkout-inp"
                        value={address.city}
                        onChange={(e) => {
                          setAddress({ ...address, city: e.target.value });
                          resetCheckoutProgress();
                        }}
                      />
                    </label>
                  </div>

                  <div className="sf-checkout-form-row sf-checkout-form-row--2">
                    <label className="sf-checkout-field">
                      <span className="sf-checkout-label">State / County / Province</span>
                      <input
                        className="sf-checkout-inp"
                        placeholder="Search"
                        value={address.state}
                        onChange={(e) => {
                          setAddress({ ...address, state: e.target.value });
                          resetCheckoutProgress();
                        }}
                      />
                    </label>
                    <label className="sf-checkout-field">
                      <span className="sf-checkout-label">Zip code / Pin</span>
                      <input
                        className="sf-checkout-inp"
                        placeholder="00000"
                        value={address.pincode}
                        onChange={(e) => {
                          setAddress({ ...address, pincode: e.target.value });
                          resetCheckoutProgress();
                        }}
                      />
                    </label>
                  </div>
                </div>

                <button type="button" className="sf-checkout-save" onClick={saveShipping}>
                  Save
                </button>
              </div>

              <button
                type="button"
                className="sf-checkout-continue"
                disabled={!addressSaved}
                onClick={confirmShipping}
              >
                Continue
              </button>
            </div>

            <aside className="sf-checkout-sidebar">
              <div className="sf-checkout-summary">
                <h2 className="sf-checkout-summary-title">Order Summary</h2>
                <div className="sf-checkout-summary-row">
                  <span>Bag total</span>
                  <b>{fmtCardPrice(cartTotalInr)}</b>
                </div>
                <div className="sf-checkout-summary-row sf-checkout-summary-row--muted">
                  <span>Estimated taxes</span>
                  <b>TBD</b>
                </div>
                <button type="button" className="sf-checkout-promo" onClick={() => {}}>
                  Apply promo code
                </button>
                {mode === "redeem" && useRewardPoints && pointsApplied > 0 ? (
                  <div className="sf-checkout-summary-row sf-checkout-summary-row--muted">
                    <span>Points applied</span>
                    <b>{fmtCardPrice(pointsApplied)}</b>
                  </div>
                ) : null}
                {mode === "redeem" && paysWithUpi ? (
                  <div className="sf-checkout-summary-row sf-checkout-summary-row--muted">
                    <span>Pay via UPI</span>
                    <b>{fmtUpiAmount(upiDueInr)}</b>
                  </div>
                ) : null}
                <div className="sf-checkout-summary-total">
                  <span>You pay</span>
                  <b>{paysWithUpi ? fmtUpiAmount(upiDueInr) : fmtCheckoutInr(cartTotalInr)}</b>
                </div>
                <button
                  type="button"
                  className="sf-checkout-pay"
                  disabled={placing || !shippingConfirmed || !canCheckout || cart.length === 0}
                  onClick={() => void placeOrder()}
                >
                  {placing
                    ? "Processing…"
                    : paysWithUpi
                      ? `Pay ${fmtUpiAmount(upiDueInr)} via UPI`
                      : "Pay now"}
                </button>
              </div>

              <div className="sf-checkout-items">
                <button
                  type="button"
                  className="sf-checkout-items-toggle"
                  aria-expanded={itemsExpanded}
                  onClick={() => setItemsExpanded((v) => !v)}
                >
                  <span>Your item{cartCount === 1 ? "" : "s"}</span>
                  <ChevronDown className={`sf-checkout-items-chevron${itemsExpanded ? " sf-checkout-items-chevron--open" : ""}`} />
                </button>
                {itemsExpanded ? (
                  <div className="sf-checkout-items-body">
                    {cart.map((l) => {
                      const variantLabel = [l.variant?.size, l.variant?.color].filter(Boolean).join(" · ");
                      return (
                        <div key={l.key} className="sf-checkout-item">
                          <div className="sf-checkout-item-img">
                            {l.image ? <img src={l.image} alt={l.name} /> : null}
                          </div>
                          <div className="sf-checkout-item-info">
                            <div className="sf-checkout-item-name">{l.name}</div>
                            {variantLabel ? (
                              <div className="sf-checkout-item-variant">{variantLabel}</div>
                            ) : null}
                            <div className="sf-checkout-item-meta">
                              <span>Qty {l.qty}</span>
                              <b>{fmtCardPrice(l.priceInr * l.qty)}</b>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* ────── DONE ────── */}
      {page === "done" && (
        <div className="sf-content sf-order-success">
          <div className="card sf-fade-in sf-order-success-card">
            <div className="sf-order-success-icon" aria-hidden="true">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#15784C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <div className="eyebrow">Order placed</div>
            <h1 className="sf-order-success-title">Thank you{recipientName ? `, ${recipientName}` : ""}!</h1>
            <p className="muted sf-order-success-copy">
              Order <b>#{orderNumber}</b> is confirmed. We&apos;ll email you tracking once it ships.
            </p>
            {balanceInr != null && balanceInr > 0 ? (
              <p className="sf-order-success-balance">
                You still have <b>{navBalanceValue(balanceInr)}</b> to spend in the store.
              </p>
            ) : null}
            <div className="sf-order-success-actions">
              <button type="button" className="sf-add-btn" onClick={continueShopping}>
                Continue shopping
              </button>
              <button
                type="button"
                className="btn btn-ghost sf-order-success-secondary"
                onClick={() => {
                  setPage("orders");
                  void refreshOrders();
                }}
              >
                View my orders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────── ORDERS ────── */}
      {page === "orders" && (
        <StorePageShell
          backLabel="← Back to store"
          onBack={() => setPage("home")}
          title="My orders"
          subtitle={
            recipientEmail
              ? `${recipientEmail}${balanceInr != null ? ` · ${navBalanceValue(balanceInr)} available` : ""}`
              : balanceInr != null
                ? `${navBalanceValue(balanceInr)} available`
                : undefined
          }
        >
          {ordersLoading ? (
            <div className="sf-orders-skeleton">
              {[1, 2].map((n) => (
                <div key={n} className="sf-order-card sf-order-card--skeleton" />
              ))}
            </div>
          ) : ordersError ? (
            <StoreEmptyState
              variant="orders"
              title="Couldn't load orders"
              description={ordersError}
              action={
                <button type="button" className="sf-btn-secondary" onClick={() => void refreshOrders()}>
                  Try again
                </button>
              }
            />
          ) : orders.length === 0 ? (
            <StoreEmptyState
              variant="orders"
              title="No orders yet"
              description="When you redeem products from the store, your order history will appear here."
              action={
                <button type="button" className="sf-btn-secondary" onClick={() => setPage("products")}>
                  Browse products
                </button>
              }
            />
          ) : (
            <div className="sf-orders-list">
              {orders.map((o) => (
                <div key={o.orderNumber} className="sf-summary-card sf-order-card">
                  <div className="sf-order-card-head">
                    <div>
                      <div className="sf-order-card-num">Order #{o.orderNumber}</div>
                      <div className="sf-order-card-date">
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : ""}
                      </div>
                    </div>
                    <span className={`sf-order-status sf-order-status--${o.status}`}>
                      {o.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="sf-order-card-meta">
                    <span>
                      {o.itemCount ?? 0} item{(o.itemCount ?? 0) === 1 ? "" : "s"}
                    </span>
                    {o.total != null ? <b>{fmt(o.total)}</b> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </StorePageShell>
      )}

      {/* ═══ FOOTER ═══ */}
      <div className="sf-footer">
        <div className="sf-footer-inner">
          <ShelfMerchLogo />
          Powered by Shelf Merch
          {mode === "preview" ? " · Recipients redeem from a private invite link." : ""}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function ProductsPageWithFilters({
  products,
  searchQuery,
  onOpen,
  priceLabel,
  shopBrand,
  selectedCategory,
}: {
  products: StoreProduct[];
  searchQuery: string;
  onOpen: (id: string) => void;
  priceLabel: (inr: number) => string;
  shopBrand: string;
  selectedCategory: string;
}) {
  const q = searchQuery.toLowerCase();
  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === "All" || p.category === selectedCategory;
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <StadiumProductGrid
      products={filtered}
      shopBrand={shopBrand}
      onOpen={onOpen}
      priceLabel={priceLabel}
    />
  );
}

function StadiumProductGrid({
  products,
  shopBrand,
  onOpen,
  priceLabel,
}: {
  products: StoreProduct[];
  shopBrand: string;
  onOpen: (id: string) => void;
  priceLabel: (inr: number) => string;
}) {
  if (products.length === 0) {
    return (
      <StoreEmptyState
        variant="search"
        title="No products found"
        description="Try adjusting your search or browse all categories."
      />
    );
  }
  return (
    <div className="sf-product-grid sf-product-grid--stadium">
      {products.map((p) => (
        <StadiumProductCard
          key={p._id}
          product={p}
          brandLabel={(p.brand || shopBrand || "Rewards").toUpperCase()}
          price={priceLabel(p.basePriceInr)}
          onOpen={() => onOpen(p._id)}
        />
      ))}
    </div>
  );
}

function StadiumProductCard({
  product,
  brandLabel,
  price,
  onOpen,
}: {
  product: StoreProduct;
  brandLabel: string;
  price: string;
  onOpen: () => void;
}) {
  return (
    <button type="button" className="sf-pcard sf-pcard--stadium" onClick={onOpen}>
      <div className="sf-pcard-img sf-pcard-img--stadium">
        <ArtworkMockup product={product} />
      </div>
      <div className="sf-pcard-meta sf-pcard-meta--stadium">
        <div className="sf-pcard-brand">{brandLabel}</div>
        <div className="sf-pcard-name">{product.name}</div>
        <div className="sf-pcard-price">{price}</div>
      </div>
    </button>
  );
}

function parseDetailRows(value?: string): [string, string][] {
  return String(value ?? "")
    .split("\n")
    .map((line) => {
      const split = line.indexOf(":");
      if (split > 0) return [line.slice(0, split).trim(), line.slice(split + 1).trim()] as [string, string];
      const trimmed = line.trim();
      return (trimmed ? [trimmed, ""] : ["", ""]) as [string, string];
    })
    .filter(([label, rowValue]) => label || rowValue);
}

function detailText(value: string) {
  return value.split("\n").map((line, i, lines) => (
    <span key={i}>
      {line}
      {i < lines.length - 1 ? <br /> : null}
    </span>
  ));
}

type ProductDetailTab = "description" | "features" | "size";

function ProductInfoTabs({ product }: { product: StoreProduct }) {
  const description = product.description?.trim() || "";
  const keyFeatures = product.keyFeatures?.trim() || "";
  const sizeGuide = product.sizeGuide?.trim() || "";
  const tabs = useMemo(
    () =>
      (
        [
          { id: "description" as const, label: "Description", show: !!description },
          { id: "features" as const, label: "Key features", show: !!keyFeatures },
          { id: "size" as const, label: "Size Guide", show: !!sizeGuide },
        ] as const
      ).filter((tab) => tab.show),
    [description, keyFeatures, sizeGuide],
  );
  const [activeTab, setActiveTab] = useState<ProductDetailTab>("description");
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    setActiveTab(tabs[0]?.id ?? "description");
    setDescExpanded(false);
  }, [product._id, tabs]);

  if (!tabs.length) return null;

  const shortDescription =
    description.length > 180 && !descExpanded ? `${description.slice(0, 180).trim()}…` : description;
  const featureRows = parseDetailRows(keyFeatures);
  const sizeRows = parseDetailRows(sizeGuide).filter(([label]) => !/^feature$/i.test(label));
  const useTabs = tabs.length > 1;
  const currentTab = useTabs ? activeTab : tabs[0].id;

  return (
    <div className="sf-pdp-info-card">
      {useTabs ? (
        <div className="sf-pdp-tabs" role="tablist" aria-label="Product information">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`sf-pdp-tab${currentTab === tab.id ? " sf-pdp-tab--on" : ""}`}
              role="tab"
              aria-selected={currentTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="sf-checkout-section-head">
          <span>Product information</span>
        </div>
      )}

      <div
        className={`sf-pdp-tab-panel${currentTab === "description" ? " sf-pdp-tab-panel--on" : ""}`}
        role="tabpanel"
        hidden={currentTab !== "description"}
      >
        <p className="sf-pdp-desc">{detailText(shortDescription)}</p>
        {description.length > 180 ? (
          <button type="button" className="sf-pdp-see-more" onClick={() => setDescExpanded((v) => !v)}>
            {descExpanded ? "See less" : "See more"}
          </button>
        ) : null}
      </div>

      <div
        className={`sf-pdp-tab-panel${currentTab === "features" ? " sf-pdp-tab-panel--on" : ""}`}
        role="tabpanel"
        hidden={currentTab !== "features"}
      >
        <div className="sf-pdp-feature-list">
          {featureRows.map(([label, value]) => (
            <div key={`${label}-${value}`} className="sf-pdp-feature-row">
              <div>{label}</div>
              <div>{value ? detailText(value) : null}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        className={`sf-pdp-tab-panel${currentTab === "size" ? " sf-pdp-tab-panel--on" : ""}`}
        role="tabpanel"
        hidden={currentTab !== "size"}
      >
        <div className="sf-pdp-size-table">
          <div className="sf-pdp-size-head">
            <div>Feature</div>
            <div>Details</div>
          </div>
          {sizeRows.map(([label, value]) => (
            <div key={`${label}-${value}`} className="sf-pdp-size-row">
              <div>{label}</div>
              <div>{value ? detailText(value) : null}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductDetail({ product, mode, priceLabel, onBack, onAdd }: {
  product: StoreProduct;
  mode: Mode;
  priceLabel: (n: number) => string;
  onBack: () => void;
  onAdd: (variant: { size?: string; color?: string }, qty: number) => void;
}) {
  const variants = product.variants || [];
  const sizes = useMemo(() => distinct(variants.map((v) => v.size)), [variants]);
  const colorOptions = useMemo(() => productColorOptions(product), [product]);
  const [selColor, setSelColor] = useState(() => primaryColorIndex(colorOptions));
  const [size, setSize] = useState<string | undefined>(() => sizes[0]);
  const [qty, setQty] = useState(1);
  const selectedColor = colorOptions[selColor];
  const previewBg = selectedColor?.hex || "#ffffff";
  const lineTotal = product.basePriceInr * qty;

  useEffect(() => {
    setSelColor(primaryColorIndex(colorOptions));
    setSize(sizes[0]);
    setQty(1);
  }, [product._id]);

  return (
    <>
      <button type="button" className="sf-bag-back" onClick={onBack}>
        ← BACK TO ALL PRODUCTS
      </button>

      <div className="sf-pdp-hero">
        <div className="sf-pdp-gallery">
          <div className="sf-pdp-media-card">
            <div className="sf-pdp-media" style={{ background: previewBg }}>
              <ArtworkMockup product={product} className="sf-pdp-thumb" />
            </div>
          </div>
        </div>

        <div className="sf-pdp-buy">
          {product.brand ? (
            <div className="sf-pdp-brand">{product.brand.toUpperCase()}</div>
          ) : null}
          <h1 className="sf-pdp-title">{product.name}</h1>
          <p className="sf-pdp-price-line">
            <b>{priceLabel(product.basePriceInr)}</b> per unit
            <span className="sf-pdp-price-sep" aria-hidden="true">
              |
            </span>
            <b>{priceLabel(lineTotal)}</b> total
          </p>

          {colorOptions.length > 0 ? (
            <div className="sf-pdp-field">
              <span className="sf-pdp-field-label">Colour</span>
              <div className="sf-pdp-option-grid">
                {colorOptions.map((c, i) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelColor(i)}
                    className={`sf-pdp-option${selColor === i ? " sf-pdp-option--on" : ""}`}
                  >
                    <span className="sf-pdp-option-swatch" style={{ background: c.hex }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {sizes.length > 0 ? (
            <div className="sf-pdp-field">
              <div className="sf-pdp-field-head">
                <span className="sf-pdp-field-label">Size</span>
                {product.sizeGuide ? (
                  <button type="button" className="sf-pdp-size-guide">
                    Size guide
                  </button>
                ) : null}
              </div>
              <select
                className="sf-pdp-select"
                value={size ?? ""}
                onChange={(e) => setSize(e.target.value || undefined)}
              >
                {sizes.length > 1 ? <option value="">Select</option> : null}
                {sizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {mode === "redeem" ? (
            <div className="sf-pdp-purchase">
              <div className="sf-pdp-purchase-qty">
                <span className="sf-pdp-field-label">Quantity</span>
                <div className="sf-bag-qty">
                  <button
                    type="button"
                    className="sf-bag-qty-btn"
                    aria-label="Decrease quantity"
                    onClick={() => setQty((n) => Math.max(1, n - 1))}
                  >
                    <MinusIcon />
                  </button>
                  <span className="sf-bag-qty-val">{qty}</span>
                  <button
                    type="button"
                    className="sf-bag-qty-btn"
                    aria-label="Increase quantity"
                    onClick={() => setQty((n) => n + 1)}
                  >
                    <PlusIcon />
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="sf-pdp-add-btn"
                onClick={() => onAdd({ size, color: selectedColor?.name }, qty)}
              >
                Add to bag
              </button>
            </div>
          ) : (
            <p className="sf-bag-preview-note">Open your invite link to redeem this item.</p>
          )}
        </div>
      </div>

      {product.description || product.keyFeatures || product.sizeGuide ? (
        <div className="sf-pdp-details">
          <ProductInfoTabs product={product} />
        </div>
      ) : null}
    </>
  );
}
