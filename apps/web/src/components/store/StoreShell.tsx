import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { type StoreShop } from "../StoreBanner";
import { resolveColorHex } from "@/lib/colorMap";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { shopBannerPresetLabel, shopHeroBannerUrl } from "@/lib/shop-banners";
import {
  DesignedProductThumb,
  storeProductAsUi,
} from "@/features/swag/DesignedProductThumb";
import walletIconImg from "../../../assets/wallet-icon.svg";

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

type Mode = "preview" | "redeem";
type Page = "home" | "products" | "product" | "cart" | "checkout" | "done";

type CartLine = {
  key: string;
  productId: string;
  name: string;
  priceInr: number;
  qty: number;
  variant?: { size?: string; color?: string };
  image?: string;
};

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

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
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
  welcome,
  onCheckout,
}: {
  shop: StoreShop;
  products: StoreProduct[];
  mode: Mode;
  currency?: "points" | "inr" | "priceless";
  creditInr?: number;
  recipientName?: string;
  welcome?: string;
  onCheckout?: (items: CheckoutItem[], address: ShippingAddress) => Promise<{ orderNumber: string }>;
}) {
  const [page, setPage] = useState<Page>("home");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [address, setAddress] = useState<ShippingAddress>({
    name: recipientName || "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [scrolled, setScrolled] = useState(false);
  const trendingRef = useRef<HTMLDivElement>(null);
  const catalogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [page]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const active = products.find((p) => p._id === activeId) || null;
  const cartCount = cart.reduce((n, l) => n + l.qty, 0);
  const cartTotalInr = cart.reduce((n, l) => n + l.priceInr * l.qty, 0);
  const overBudget = mode === "redeem" && creditInr != null && cartTotalInr > creditInr;

  function fmt(inr: number) {
    if (currency === "priceless") return "Gift";
    if (currency === "points") return `${Math.round(inr / 2).toLocaleString("en-IN")} pts`;
    return `₹${inr.toLocaleString("en-IN")}`;
  }

  function navBalanceLabel() {
    if (currency === "points") return "Your points";
    if (currency === "inr") return "You pay";
    return "Your gift";
  }

  function navBalanceValue(inr: number) {
    if (currency === "points") return `${Math.round(inr / 2).toLocaleString("en-IN")} pts`;
    if (currency === "inr") return `₹${inr.toLocaleString("en-IN")}`;
    return "Gift";
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
    setCart((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l));
      return [
        ...prev,
        {
          key,
          productId: p._id,
          name: p.name,
          priceInr: p.basePriceInr,
          qty,
          variant: variant.size || variant.color ? variant : undefined,
          image: storeProductThumb(p),
        },
      ];
    });
    setPage("cart");
  }

  function setLineQty(key: string, qty: number) {
    setCart((prev) =>
      qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty } : l)),
    );
  }

  async function placeOrder() {
    setError("");
    const missing = (["name", "phone", "line1", "city", "state", "pincode"] as const).filter(
      (k) => !address[k].trim(),
    );
    if (missing.length) {
      setError("Please complete your shipping details (name, phone and full address).");
      return;
    }
    if (!onCheckout) return;
    setPlacing(true);
    try {
      const items: CheckoutItem[] = cart.map((l) => ({ productId: l.productId, qty: l.qty, variant: l.variant }));
      const res = await onCheckout(items, address);
      setOrderNumber(res.orderNumber);
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
            {mode === "redeem" && creditInr != null && (
              <button
                type="button"
                className="topbar-wallet sf-topbar-wallet"
                aria-label={currency === "points" ? "Your points balance" : "Available balance"}
              >
                <span className="topbar-wallet-icon">
                  <img src={walletIconImg} alt="" className="topbar-wallet-img" aria-hidden="true" />
                </span>
                <span className="topbar-wallet-copy">
                  <span className="k">{navBalanceLabel()}</span>
                  <span className="v">
                    {navBalanceValue(creditInr)}
                    <ChevronDown />
                  </span>
                </span>
              </button>
            )}

            <button type="button" className="topbar-user sf-topbar-user" aria-label="Account">
              <span className="topbar-user-avatar">{userInitials}</span>
              <span className="topbar-user-copy">
                <span className="topbar-user-name">{displayName}</span>
                <span className="topbar-user-sub">{workspaceLabel}</span>
              </span>
              <ChevronDown className="topbar-chevron sf-topbar-user-chevron" />
            </button>

            {mode === "redeem" && (
              <button
                type="button"
                className="sf-topbar-cart"
                onClick={() => setPage("cart")}
                aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
              >
                <ShoppingBagIcon />
                {cartCount > 0 ? <span className="sf-topbar-cart-badge">{cartCount}</span> : null}
              </button>
            )}
          </div>
        </div>
      </div>

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
            {/* Featured — horizontal scroll when enough products */}
            {products.length > 4 && (
              <>
                <div className="sf-section-header">
                  <div className="sf-section-title-wrap">
                    <h2 className="sf-section-title">Featured</h2>
                    <p className="sf-section-subtitle">Popular picks from your catalog</p>
                  </div>
                  <div className="sf-section-actions">
                    <button type="button" className="sf-view-all" onClick={() => setPage("products")}>
                      View all <ArrowRightIcon />
                    </button>
                    <button type="button" className="sf-scroll-btn" onClick={() => trendingRef.current?.scrollBy({ left: -240, behavior: "smooth" })}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <button type="button" className="sf-scroll-btn" onClick={() => trendingRef.current?.scrollBy({ left: 240, behavior: "smooth" })}>
                      <ArrowRightIcon />
                    </button>
                  </div>
                </div>
                <div className="sf-trending-track" ref={trendingRef}>
                  {products.slice(0, 8).map((p) => (
                    <button key={p._id} type="button" className="sf-trending-card" onClick={() => openProduct(p._id)}>
                      <div className="sf-trending-img">
                        <ArtworkMockup product={p} />
                      </div>
                      <div className="sf-trending-meta">
                        <div className="sf-trending-name">{p.name}</div>
                        <div className="sf-trending-cat">{p.category || p.group || "Merchandise"}</div>
                        <div className="sf-trending-price">
                          <PointsIcon /> {fmt(p.basePriceInr)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* All Products */}
            {products.length > 0 ? (
              <>
                <div className="sf-section-header">
                  <div className="sf-section-title-wrap">
                    <h2 className="sf-section-title">{products.length > 4 ? "All Products" : "Shop collection"}</h2>
                    <p className="sf-section-subtitle">{products.length} reward{products.length !== 1 ? "s" : ""} available to redeem</p>
                  </div>
                </div>
                <PremiumProductGrid products={filteredBySearch.slice(0, 8)} onOpen={openProduct} fmt={fmt} />
              </>
            ) : (
              <div className="sf-empty" style={{ marginTop: 24 }}>
                <div className="sf-empty-icon">🛍️</div>
                <h3>No products in this shop yet</h3>
                <p>Check back soon — new rewards are on the way.</p>
              </div>
            )}

            {filteredBySearch.length > 8 && (
              <div style={{ textAlign: "center", padding: "8px 0 40px" }}>
                <button type="button" className="sf-hero-btn sf-hero-btn-primary" onClick={() => setPage("products")}>
                  View All Products <ArrowRightIcon />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ────── PRODUCTS ────── */}
      {page === "products" && (
        <div className="sf-content" style={{ paddingTop: 8 }}>
          <div className="sf-section-header" style={{ paddingTop: 20 }}>
            <h1 className="sf-section-title" style={{ fontSize: 28 }}>Products</h1>
          </div>
          <ProductsPageWithFilters
            products={products}
            searchQuery={searchQuery}
            onOpen={openProduct}
            fmt={fmt}
            selectedCategory={selectedCategory}
          />
        </div>
      )}

      {/* ────── PRODUCT DETAIL ────── */}
      {page === "product" && active && (
        <div className="sf-content" style={{ paddingTop: 24, paddingBottom: 60 }}>
          <ProductDetail
            product={active}
            mode={mode}
            fmt={fmt}
            onBack={() => setPage("products")}
            onAdd={(variant, qty) => addToCart(active, variant, qty)}
          />
        </div>
      )}

      {/* ────── CART ────── */}
      {page === "cart" && (
        <div className="sf-cart-container">
          <h1 className="sf-cart-title">Your cart</h1>
          {cart.length === 0 ? (
            <div className="sf-empty">
              <div className="sf-empty-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p style={{ marginBottom: 20 }}>Browse our collection and add items you love.</p>
              <button className="sf-add-btn" onClick={() => setPage("products")}>Browse products</button>
            </div>
          ) : (
            <>
              <div className="sf-cart-card">
                {cart.map((l) => (
                  <div key={l.key} className="sf-cart-item">
                    <div className="sf-cart-item-img">
                      {l.image ? <img src={l.image} alt={l.name} /> : null}
                    </div>
                    <div className="sf-cart-item-info">
                      <div className="sf-cart-item-name">{l.name}</div>
                      {l.variant && (
                        <div className="sf-cart-item-variant">
                          {[l.variant.color, l.variant.size].filter(Boolean).join(" · ")}
                        </div>
                      )}
                      <div className="sf-cart-item-price">{fmt(l.priceInr)} each</div>
                    </div>
                    <input
                      className="sf-cart-qty-input"
                      type="number"
                      min={0}
                      value={l.qty}
                      onChange={(e) => setLineQty(l.key, Math.max(0, Number(e.target.value)))}
                    />
                    <div className="sf-cart-item-total">{fmt(l.priceInr * l.qty)}</div>
                  </div>
                ))}
              </div>
              <div className="sf-summary-card">
                <div className="sf-summary-row">
                  <span>Subtotal</span>
                  <b>{fmt(cartTotalInr)}</b>
                </div>
                {mode === "redeem" && creditInr != null && (
                  <div className="sf-summary-row" style={{ color: overBudget ? "var(--danger)" : "inherit" }}>
                    <span>Remaining balance after order</span>
                    <b>{fmt(Math.max(0, creditInr - cartTotalInr))}</b>
                  </div>
                )}
                {overBudget && (
                  <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 8, fontWeight: 500 }}>
                    Your cart exceeds your balance. Remove an item or lower a quantity.
                  </p>
                )}
                {mode === "redeem" ? (
                  <button className="sf-add-btn" style={{ width: "100%", marginTop: 16, height: 46 }} disabled={overBudget} onClick={() => setPage("checkout")}>
                    Proceed to checkout
                  </button>
                ) : (
                  <p className="mut3" style={{ fontSize: 12, marginTop: 12 }}>Open your invite link to check out.</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ────── CHECKOUT ────── */}
      {page === "checkout" && (
        <div className="sf-cart-container">
          <button type="button" className="sf-back-btn" onClick={() => setPage("cart")} style={{ marginBottom: 16 }}>← Back to cart</button>
          <h1 className="sf-cart-title">Checkout</h1>
          {error && <div className="sf-summary-card" style={{ padding: 14, marginBottom: 16, color: "var(--danger)" }}>{error}</div>}
          <div className="sf-summary-card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, marginBottom: 16, fontWeight: 700 }}>Shipping Address</h3>
            <div className="row" style={{ gap: 12 }}>
              <input className="inp" placeholder="Full name" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} style={{ borderRadius: 12 }} />
              <input className="inp" placeholder="Phone number" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} style={{ borderRadius: 12 }} />
            </div>
            <input className="inp" placeholder="Address line" style={{ marginTop: 10, borderRadius: 12 }} value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
            <div className="row" style={{ gap: 12, marginTop: 10 }}>
              <input className="inp" placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} style={{ borderRadius: 12 }} />
              <input className="inp" placeholder="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} style={{ borderRadius: 12 }} />
              <input className="inp" placeholder="PIN" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} style={{ borderRadius: 12 }} />
            </div>
          </div>
          <div className="sf-summary-card">
            <div className="sf-summary-row" style={{ marginBottom: 16 }}>
              <span>{cartCount} item(s)</span>
              <b>{fmt(cartTotalInr)}</b>
            </div>
            <button className="sf-add-btn" style={{ width: "100%", height: 46 }} disabled={placing || overBudget || cart.length === 0} onClick={placeOrder}>
              {placing ? "Placing order…" : "Place order"}
            </button>
          </div>
        </div>
      )}

      {/* ────── DONE ────── */}
      {page === "done" && (
        <div className="sf-content" style={{ paddingTop: 60, paddingBottom: 60 }}>
          <div className="card sf-fade-in" style={{ padding: 48, textAlign: "center", maxWidth: 520, margin: "0 auto", borderRadius: 24 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#eaf5ef", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#15784C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <div className="eyebrow">Order placed</div>
            <h1 style={{ fontSize: 28, margin: "8px 0" }}>Thank you{recipientName ? `, ${recipientName}` : ""}! 🎁</h1>
            <p className="muted" style={{ fontSize: 15, lineHeight: 1.6 }}>
              Order <b>{orderNumber}</b> is confirmed. We'll email you tracking once it ships.
            </p>
          </div>
        </div>
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
  fmt,
  selectedCategory,
}: {
  products: StoreProduct[];
  searchQuery: string;
  onOpen: (id: string) => void;
  fmt: (n: number) => string;
  selectedCategory: string;
}) {
  const q = searchQuery.toLowerCase();
  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === "All" || p.category === selectedCategory;
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div style={{ marginTop: 20 }}>
      <PremiumProductGrid products={filtered} onOpen={onOpen} fmt={fmt} />
    </div>
  );
}

function PremiumProductGrid({
  products,
  onOpen,
  fmt,
}: {
  products: StoreProduct[];
  onOpen: (id: string) => void;
  fmt: (n: number) => string;
}) {
  if (products.length === 0) {
    return (
      <div className="sf-empty">
        <div className="sf-empty-icon">🔍</div>
        <h3>No products found</h3>
        <p>Try adjusting your search or filters.</p>
      </div>
    );
  }
  return (
    <div className="sf-product-grid sf-stagger">
      {products.map((p) => {
        const colors = productColorOptions(p);
        return (
          <button key={p._id} type="button" className="sf-pcard" onClick={() => onOpen(p._id)}>
            <div className="sf-pcard-img">
              <ArtworkMockup product={p} />
              <div className="sf-wishlist" onClick={(e) => { e.stopPropagation(); }}>
                <HeartIcon />
              </div>
            </div>
            <div className="sf-pcard-meta">
              <div className="sf-pcard-name">{p.name}</div>
              <div className="sf-pcard-category">{p.category || p.group || "Merchandise"}</div>
              <div className="sf-pcard-price">
                <PointsIcon /> {fmt(p.basePriceInr)}
              </div>
              {colors.length > 0 && (
                <div className="sf-pcard-swatches">
                  {colors.slice(0, 5).map((c) => (
                    <span key={c.name} className="sf-pcard-sw" style={{ background: c.hex }} title={c.name} />
                  ))}
                  {colors.length > 5 && <span style={{ fontSize: 10, color: "#8C988F", alignSelf: "center" }}>+{colors.length - 5}</span>}
                </div>
              )}
              <div className="sf-pcard-cta">
                <ShoppingBagIcon /> Redeem Now
              </div>
            </div>
          </button>
        );
      })}
    </div>
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
    <div className="sf-detail-info" style={{ marginBottom: 24 }}>
      {useTabs ? (
        <div className="pd-detail-tabs" role="tablist" aria-label="Product information">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={currentTab === tab.id ? "on" : ""}
              role="tab"
              aria-selected={currentTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      <div
        className={`pd-tab-panel pd-description-panel${currentTab === "description" ? " on" : ""}`}
        role="tabpanel"
        hidden={currentTab !== "description"}
      >
        <p className="sf-detail-desc" style={{ marginBottom: 8 }}>{detailText(shortDescription)}</p>
        {description.length > 180 ? (
          <button type="button" className="lnk" style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }} onClick={() => setDescExpanded((v) => !v)}>
            {descExpanded ? "See less" : "See more"}
          </button>
        ) : null}
      </div>

      <div
        className={`pd-tab-panel${currentTab === "features" ? " on" : ""}`}
        role="tabpanel"
        hidden={currentTab !== "features"}
      >
        <div className="pd-feature-card">
          {featureRows.map(([label, value]) => (
            <div key={`${label}-${value}`} className="pd-feature-row">
              <div>{label}</div>
              <div>{value ? detailText(value) : null}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        className={`pd-tab-panel${currentTab === "size" ? " on" : ""}`}
        role="tabpanel"
        hidden={currentTab !== "size"}
      >
        <div className="pd-size-table">
          <div className="pd-size-head">
            <div>Feature</div>
            <div>Details</div>
          </div>
          {sizeRows.map(([label, value]) => (
            <div key={`${label}-${value}`} className="pd-size-row">
              <div>{label}</div>
              <div>{value ? detailText(value) : null}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductDetail({ product, mode, fmt, onBack, onAdd }: {
  product: StoreProduct;
  mode: Mode;
  fmt: (n: number) => string;
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

  useEffect(() => {
    setSelColor(primaryColorIndex(colorOptions));
    setSize(sizes[0]);
    setQty(1);
  }, [product._id]);

  return (
    <>
      <button type="button" className="sf-back-btn" onClick={onBack} style={{ marginBottom: 20 }}>← Back to products</button>
      <div className="sf-detail-grid">
        <div className="sf-detail-gallery">
          <div className="sf-detail-img-box" style={{ background: previewBg }}>
            <div className="sf-detail-img-inner">
              <ArtworkMockup product={product} />
            </div>
          </div>
          {/* {colorOptions.length > 0 && (
            <div className="pd-colors" style={{ marginTop: 20 }}>
              <div className="lbl" style={{ marginBottom: 10 }}>Color preview</div>
              <ColorSwatches colors={colorOptions} selected={selColor} onSelect={setSelColor} />
            </div>
          )} */}
        </div>
        <div>
          {product.brand && <div className="sf-detail-brand">{product.brand}</div>}
          <h1 className="sf-detail-name">{product.name}</h1>
          <div className="sf-detail-price">
            <PointsIcon /> {fmt(product.basePriceInr)}
          </div>
          <ProductInfoTabs product={product} />

          {colorOptions.length > 0 && (
            <div className="field">
              <label className="lbl">Colour</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {colorOptions.map((c, i) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelColor(i)}
                    className={`sf-option-btn${selColor === i ? " active" : ""}`}
                  >
                    <span className="sf-option-btn-swatch" style={{ background: c.hex }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {sizes.length > 0 && (
            <div className="field">
              <label className="lbl">Size</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`sf-option-btn${size === s ? " active" : ""}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "redeem" ? (
            <div className="row" style={{ gap: 12, marginTop: 24, alignItems: "center" }}>
              <input
                className="sf-qty-input"
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              />
              <button className="sf-add-btn" onClick={() => onAdd({ size, color: selectedColor?.name }, qty)}>
                <ShoppingBagIcon /> Add to cart
              </button>
            </div>
          ) : (
            <p className="mut3" style={{ fontSize: 13, marginTop: 22, padding: "14px 18px", background: "#FBF3DC", borderRadius: 12, border: "1px solid #F0E2B0", color: "#7A5A00" }}>
              Open your private invite link to redeem this item.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
