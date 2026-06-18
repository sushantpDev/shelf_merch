import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { type StoreShop, BANNER_THEMES } from "../StoreBanner";
import { resolveColorHex } from "@/lib/colorMap";

type PrintArea = {
  key?: string;
  label?: string;
  mockupImageUrl?: string;
  box: { xPct: number; yPct: number; widthPct: number; heightPct: number };
};

export type StoreProduct = {
  _id: string;
  name: string;
  brand?: string;
  group?: string;
  category?: string;
  description?: string;
  basePriceInr: number;
  primaryImageUrl?: string;
  imageUrls?: string[];
  maskImageUrl?: string;
  baseImageUrl?: string;
  artworkUrl?: string;
  preferredColors?: string[];
  printAreas?: PrintArea[];
  variants?: Array<{ size?: string; color?: string; colorHex?: string; material?: string; sku?: string }>;
};

function normMediaPath(url?: string) {
  if (!url) return "";
  const path = url.replace(/^https?:\/\/[^/]+/i, "");
  return path.startsWith("/") ? path : `/${path}`;
}

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

function pickPrintArea(p: StoreProduct): PrintArea | null {
  const areas = p.printAreas;
  if (!areas?.length) return null;
  const mask = normMediaPath(p.maskImageUrl);
  if (mask) {
    const maskArea = areas.find((a) => normMediaPath(a.mockupImageUrl) === mask);
    if (maskArea) return maskArea;
  }
  const img = normMediaPath(productImage(p));
  if (img) {
    const match = areas.find((a) => normMediaPath(a.mockupImageUrl) === img);
    if (match) return match;
  }
  return areas.find((a) => a?.box?.widthPct > 0 && a?.box?.heightPct > 0) || areas[0] || null;
}

function printAreaWrapStyle(box?: PrintArea["box"]): CSSProperties {
  const fit: CSSProperties = {
    boxSizing: "border-box",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
    minHeight: 0,
    pointerEvents: "none",
  };
  if (!box?.widthPct || !box?.heightPct) {
    return {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: "34%",
      height: "34%",
      ...fit,
    };
  }
  return {
    position: "absolute",
    left: `${box.xPct}%`,
    top: `${box.yPct}%`,
    width: `${box.widthPct}%`,
    height: `${box.heightPct}%`,
    ...fit,
  };
}

function ArtworkMockup({ product, className, style }: { product: StoreProduct; className?: string; style?: CSSProperties }) {
  const img = productImage(product);
  const area = pickPrintArea(product);
  const overlay = product.artworkUrl;

  if (!img) {
    return (
      <div className={className} style={{ display: "grid", placeItems: "center", height: "100%", ...style }}>
        <span className="mut3" style={{ fontSize: 12 }}>No image</span>
      </div>
    );
  }

  return (
    <div className={className} style={{ position: "relative", width: "100%", height: "100%", ...style }}>
      <img
        className="mockup-base"
        src={img}
        alt={product.name}
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
      />
      {overlay && area && (
        <div className="art-overlay" style={printAreaWrapStyle(area.box)}>
          <img className="art-overlay-img" src={overlay} alt="Artwork" />
        </div>
      )}
    </div>
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
  city: string;
  state: string;
  pincode: string;
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
  return p.maskImageUrl || p.primaryImageUrl || p.imageUrls?.[0] || "";
}

/* ─── category icon helper ─── */
const CATEGORY_ICONS: Record<string, string> = {
  all: "M4 6h16M4 12h16M4 18h16",
  apparel: "M12 2L6 7v15h12V7l-6-5zM8 7h8",
  drinkware: "M17 8h1a4 4 0 010 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z",
  bags: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0",
  tech: "M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
  accessories: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  office: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
};

function CategoryIcon({ category }: { category: string }) {
  const key = category.toLowerCase();
  const d = CATEGORY_ICONS[key] || CATEGORY_ICONS.all;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/* ─── badge assignment (deterministic, cosmetic only) ─── */
type BadgeType = "bestseller" | "new" | "limited" | "trending" | null;
function assignBadge(index: number, total: number): BadgeType {
  if (total <= 2) return null;
  if (index === 0) return "bestseller";
  if (index === 1) return "new";
  if (index === total - 1) return "limited";
  if (index === 2) return "trending";
  return null;
}
const BADGE_LABELS: Record<string, string> = {
  bestseller: "Bestseller",
  new: "New Arrival",
  limited: "Limited Stock",
  trending: "Trending",
};

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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
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
    <svg viewBox="0 0 24 24" fill="currentColor">
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

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
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

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [page]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const theme = BANNER_THEMES[shop.bannerTheme || "light"] || BANNER_THEMES.light;
  const active = products.find((p) => p._id === activeId) || null;
  const categories = useMemo(() => distinct(products.map((p) => p.category)), [products]);
  const cartCount = cart.reduce((n, l) => n + l.qty, 0);
  const cartTotalInr = cart.reduce((n, l) => n + l.priceInr * l.qty, 0);
  const overBudget = mode === "redeem" && creditInr != null && cartTotalInr > creditInr;

  function fmt(inr: number) {
    if (currency === "priceless") return "Gift";
    if (currency === "points") return `${Math.round(inr / 2).toLocaleString("en-IN")} pts`;
    return `₹${inr.toLocaleString("en-IN")}`;
  }

  function fmtRaw(inr: number) {
    if (currency === "priceless") return "Gift";
    if (currency === "points") return Math.round(inr / 2).toLocaleString("en-IN");
    return `₹${inr.toLocaleString("en-IN")}`;
  }

  function openProduct(id: string) {
    setActiveId(id);
    setPage("product");
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
          image: productImage(p),
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
        <div className="sf-topbar-inner">
          <button type="button" className="sf-brand" onClick={() => setPage("home")}>
            <div className="sf-brand-icon"><ShelfMerchLogo /></div>
            <span className="sf-brand-name">Shelf Merch</span>
          </button>

          <div className="sf-brand-sep" />

          <div className="sf-store-badge">
            <div className="sf-store-badge-logo">
              {shop.logoUrl ? (
                <img src={shop.logoUrl} alt={shop.name} />
              ) : (
                <span style={{ fontWeight: 800, color: "#15784C", fontSize: 13 }}>{shop.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span>{shop.name} Rewards Store</span>
          </div>

          <nav className="sf-nav">
            <button type="button" className={`sf-nav-link${page === "home" ? " active" : ""}`} onClick={() => setPage("home")}>Home</button>
            <button type="button" className={`sf-nav-link${page === "products" ? " active" : ""}`} onClick={() => setPage("products")}>
              Categories <ChevronDown />
            </button>
            <button type="button" className="sf-nav-link" onClick={() => setPage("products")}>How it works</button>
            {mode === "redeem" && (
              <button type="button" className="sf-nav-link" onClick={() => setPage("cart")}>My Orders</button>
            )}
          </nav>

          <div className="sf-topbar-right">
            <button type="button" className="sf-icon-btn" title="Search" onClick={() => setPage("products")}>
              <SearchIcon />
            </button>
            <button type="button" className="sf-icon-btn" title="Notifications">
              <BellIcon />
              <span className="sf-badge-dot" />
            </button>

            {mode === "redeem" && creditInr != null && (
              <div className="sf-points-pill">
                <PointsIcon />
                <span className="sf-pts-val">{fmtRaw(creditInr)}</span>
                {currency === "points" ? " Points" : ""}
              </div>
            )}

            {mode === "redeem" && cartCount > 0 && (
              <button type="button" className="sf-icon-btn" onClick={() => setPage("cart")} style={{ position: "relative" }}>
                <ShoppingBagIcon />
                <span style={{
                  position: "absolute", top: -4, right: -4, width: 20, height: 20,
                  borderRadius: "50%", background: "#15784C", color: "#fff",
                  fontSize: 11, fontWeight: 700, display: "grid", placeItems: "center",
                  border: "2px solid #fff",
                }}>{cartCount}</span>
              </button>
            )}

            <div className="sf-avatar" title={recipientName || "User"}>{userInitials}</div>
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
          {/* Hero */}
          <div className="sf-hero-container">
            <div className="sf-hero">
              <div className="sf-hero-inner">
              {/* Left text block */}
              <div className="sf-hero-text sf-fade-in">
                <div className="sf-hero-welcome">
                  {mode === "redeem"
                    ? `Welcome back, ${recipientName || "there"} 👋`
                    : `${shop.name} Rewards`}
                </div>
                <h1>Redeem your rewards.<br />Celebrate your success.</h1>
                <p className="sf-hero-sub">
                  {welcome || "Explore exclusive merchandise, handpicked for high performers like you."}
                </p>
                <div className="sf-hero-actions">
                  <button type="button" className="sf-hero-btn sf-hero-btn-primary" onClick={() => setPage("products")}>
                    <ShoppingBagIcon /> Browse Products
                  </button>
                  <button type="button" className="sf-hero-btn sf-hero-btn-secondary" onClick={() => setPage("products")}>
                    <GridIcon /> View Categories
                  </button>
                </div>
              </div>

              {/* Hero right — Stats panel */}
              <div className="sf-hero-stats sf-fade-in" style={{ animationDelay: ".15s" }}>
                {/* Balance card */}
                {mode === "redeem" && creditInr != null && (
                  <div className="sf-hstat-card sf-hstat-balance">
                    <div className="sf-hstat-label">Available Balance</div>
                    <div className="sf-hstat-value-row">
                      <div className="sf-hstat-icon">
                        <svg viewBox="0 0 24 24" fill="none"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#fff"/></svg>
                      </div>
                      <span className="sf-hstat-big">{fmtRaw(creditInr)}</span>
                    </div>
                    <div className="sf-hstat-sub">{currency === "points" ? "Points to redeem" : "Credits available"}</div>
                  </div>
                )}
                {/* Quick stat pills */}
                <div className="sf-hstat-pills">
                  <div className="sf-hstat-pill">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
                    <div>
                      <div className="sf-hstat-pill-val">{products.length}{products.length > 0 ? '+' : ''}</div>
                      <div className="sf-hstat-pill-label">Products</div>
                    </div>
                  </div>
                  <div className="sf-hstat-pill">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                    <div>
                      <div className="sf-hstat-pill-val">{categories.length}</div>
                      <div className="sf-hstat-pill-label">Categories</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          </div>

          {/* Search & Filter */}
          <div className="sf-content">
            <div className="sf-search-section">
              <SearchFilterBar
                categories={categories}
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategorySelect={(c) => {
                  setSelectedCategory(c);
                  setPage("products");
                }}
              />
            </div>

            {/* Trending Rewards */}
            {products.length > 0 && (
              <>
                <div className="sf-section-header">
                  <h2 className="sf-section-title">Trending Rewards</h2>
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
                  <h2 className="sf-section-title">All Products</h2>
                </div>
                <PremiumProductGrid products={filteredBySearch.slice(0, 8)} onOpen={openProduct} fmt={fmt} totalProducts={products.length} />
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
                <button type="button" className="sf-hero-btn sf-hero-btn-secondary" style={{ background: "#0E1E16", color: "#fff", border: "none" }} onClick={() => setPage("products")}>
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
            categories={categories}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            onOpen={openProduct}
            fmt={fmt}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
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
        <div className="sf-content" style={{ paddingTop: 24, paddingBottom: 60, maxWidth: 720, margin: "0 auto" }}>
          <h1 style={{ fontSize: 28, marginBottom: 20, fontFamily: "'Bricolage Grotesque','Inter',sans-serif", fontWeight: 700 }}>Your cart</h1>
          {cart.length === 0 ? (
            <div className="sf-empty">
              <div className="sf-empty-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p style={{ marginBottom: 20 }}>Browse our collection and add items you love.</p>
              <button className="sf-hero-btn sf-hero-btn-primary" style={{ background: "#0E1E16", color: "#fff" }} onClick={() => setPage("products")}>Browse products</button>
            </div>
          ) : (
            <>
              <div className="card" style={{ padding: 0, overflow: "hidden", borderRadius: 18 }}>
                {cart.map((l) => (
                  <div key={l.key} className="row" style={{ alignItems: "center", gap: 14, padding: 16, borderBottom: "1px solid var(--line)" }}>
                    <div style={{ width: 60, height: 60, flex: "none", background: "var(--surface-2)", borderRadius: 14, overflow: "hidden", display: "grid", placeItems: "center" }}>
                      {l.image ? <img src={l.image} alt={l.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{l.name}</div>
                      {l.variant && (
                        <div className="mut3" style={{ fontSize: 12 }}>
                          {[l.variant.color, l.variant.size].filter(Boolean).join(" · ")}
                        </div>
                      )}
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#15784C", marginTop: 2 }}>{fmt(l.priceInr)} each</div>
                    </div>
                    <input
                      className="inp"
                      type="number"
                      min={0}
                      value={l.qty}
                      onChange={(e) => setLineQty(l.key, Math.max(0, Number(e.target.value)))}
                      style={{ width: 72, height: 40, borderRadius: 12, textAlign: "center" }}
                    />
                    <div style={{ width: 90, textAlign: "right", fontWeight: 700, fontSize: 15 }}>{fmt(l.priceInr * l.qty)}</div>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding: 24, marginTop: 16, borderRadius: 18 }}>
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 15 }}>Subtotal</span>
                  <b style={{ fontSize: 18 }}>{fmt(cartTotalInr)}</b>
                </div>
                {mode === "redeem" && creditInr != null && (
                  <div className="row" style={{ justifyContent: "space-between", color: overBudget ? "var(--danger)" : "var(--ink-2)", fontSize: 14 }}>
                    <span>Remaining after order</span>
                    <span>{fmt(Math.max(0, creditInr - cartTotalInr))}</span>
                  </div>
                )}
                {overBudget && (
                  <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 8 }}>
                    Your cart exceeds your balance. Remove an item or lower a quantity.
                  </p>
                )}
                {mode === "redeem" ? (
                  <button className="sf-hero-btn sf-hero-btn-primary" style={{ background: "#15784C", color: "#fff", width: "100%", justifyContent: "center", marginTop: 16, height: 50 }} disabled={overBudget} onClick={() => setPage("checkout")}>
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
        <div className="sf-content" style={{ paddingTop: 24, paddingBottom: 60, maxWidth: 620, margin: "0 auto" }}>
          <button type="button" className="lnk" onClick={() => setPage("cart")} style={{ marginBottom: 16 }}>← Back to cart</button>
          <h1 style={{ fontSize: 28, marginBottom: 20, fontFamily: "'Bricolage Grotesque','Inter',sans-serif", fontWeight: 700 }}>Checkout</h1>
          {error && <div className="card" style={{ padding: 12, marginBottom: 16, color: "var(--danger)", borderRadius: 14 }}>{error}</div>}
          <div className="card" style={{ padding: 24, borderRadius: 18 }}>
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>Shipping address</h3>
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
          <div className="card" style={{ padding: 24, marginTop: 16, borderRadius: 18 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
              <span className="muted">{cartCount} item(s)</span>
              <b style={{ fontSize: 18 }}>{fmt(cartTotalInr)}</b>
            </div>
            <button className="sf-hero-btn sf-hero-btn-primary" style={{ background: "#15784C", color: "#fff", width: "100%", justifyContent: "center", marginTop: 12, height: 50 }} disabled={placing || overBudget || cart.length === 0} onClick={placeOrder}>
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

function SearchFilterBar({
  categories,
  searchQuery,
  onSearch,
  selectedCategory,
  onCategorySelect,
}: {
  categories: string[];
  searchQuery: string;
  onSearch: (q: string) => void;
  selectedCategory?: string;
  onCategorySelect: (c: string) => void;
}) {
  return (
    <div className="sf-search-bar">
      <div className="sf-search-input-wrap">
        <SearchIcon />
        <input
          className="sf-search-input"
          placeholder="Search for products, categories..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div className="sf-chip-row">
        {["All", ...categories].map((c) => (
          <button
            key={c}
            type="button"
            className={`sf-category-chip${(selectedCategory || "All") === c ? " active" : ""}`}
            onClick={() => onCategorySelect(c)}
          >
            <CategoryIcon category={c} />
            {c}
          </button>
        ))}
      </div>
      <div className="sf-sort-wrap">
        <span className="sf-sort-label">Sort by:</span>
        <select className="sf-sort-select">
          <option>Popular</option>
          <option>Price: Low to High</option>
          <option>Price: High to Low</option>
          <option>Newest</option>
        </select>
      </div>
    </div>
  );
}

function ProductsPageWithFilters({
  products,
  categories,
  searchQuery,
  onSearch,
  onOpen,
  fmt,
  selectedCategory,
  onCategorySelect,
}: {
  products: StoreProduct[];
  categories: string[];
  searchQuery: string;
  onSearch: (q: string) => void;
  onOpen: (id: string) => void;
  fmt: (n: number) => string;
  selectedCategory: string;
  onCategorySelect: (c: string) => void;
}) {
  const q = searchQuery.toLowerCase();
  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === "All" || p.category === selectedCategory;
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <>
      <SearchFilterBar
        categories={categories}
        searchQuery={searchQuery}
        onSearch={onSearch}
        selectedCategory={selectedCategory}
        onCategorySelect={onCategorySelect}
      />
      <div style={{ marginTop: 20 }}>
        <PremiumProductGrid products={filtered} onOpen={onOpen} fmt={fmt} totalProducts={products.length} />
      </div>
    </>
  );
}

function PremiumProductGrid({
  products,
  onOpen,
  fmt,
  totalProducts,
}: {
  products: StoreProduct[];
  onOpen: (id: string) => void;
  fmt: (n: number) => string;
  totalProducts: number;
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
      {products.map((p, i) => {
        const colors = productColorOptions(p);
        const badge = assignBadge(i, totalProducts);
        return (
          <button key={p._id} type="button" className="sf-pcard" onClick={() => onOpen(p._id)}>
            <div className="sf-pcard-img">
              <ArtworkMockup product={p} />
              <div className="sf-wishlist" onClick={(e) => { e.stopPropagation(); }}>
                <HeartIcon />
              </div>
              {badge && (
                <span className={`sf-badge sf-badge-${badge}`}>{BADGE_LABELS[badge]}</span>
              )}
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
      <button type="button" className="lnk" onClick={onBack} style={{ marginBottom: 20, fontSize: 14 }}>← Back to products</button>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 36, alignItems: "start" }}>
        <div className="pd-gallery">
          <div style={{ aspectRatio: "1", borderRadius: 20, border: "1px solid #EFF2EF", position: "relative", overflow: "hidden", display: "grid", placeItems: "center", transition: "background .2s ease", background: previewBg }}>
            <div className="pd-img-inner pd-img-mockup">
              <ArtworkMockup product={product} />
            </div>
          </div>
          {colorOptions.length > 0 && (
            <div className="pd-colors" style={{ marginTop: 18 }}>
              <div className="lbl" style={{ marginBottom: 10 }}>Color preview</div>
              <ColorSwatches colors={colorOptions} selected={selColor} onSelect={setSelColor} />
            </div>
          )}
        </div>
        <div>
          {product.brand && <div className="mut3" style={{ textTransform: "uppercase", letterSpacing: ".04em", fontSize: 12, marginBottom: 6 }}>{product.brand}</div>}
          <h1 style={{ fontSize: 30, margin: "0 0 10px", fontFamily: "'Bricolage Grotesque','Inter',sans-serif" }}>{product.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 24, fontWeight: 700, color: "#15784C", marginBottom: 18 }}>
            <PointsIcon /> {fmt(product.basePriceInr)}
          </div>
          {product.description && <p className="muted" style={{ marginBottom: 22, lineHeight: 1.65 }}>{product.description}</p>}

          {colorOptions.length > 0 && (
            <div className="field">
              <label className="lbl">Colour</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {colorOptions.map((c, i) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelColor(i)}
                    className={selColor === i ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 10 }}
                  >
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: c.hex, border: "1px solid rgba(0,0,0,.2)" }} />
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
                  <button key={s} type="button" onClick={() => setSize(s)} className={size === s ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"} style={{ borderRadius: 10 }}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {mode === "redeem" ? (
            <div className="row" style={{ gap: 12, marginTop: 22, alignItems: "center" }}>
              <input className="inp" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} style={{ width: 80, borderRadius: 12, textAlign: "center" }} />
              <button className="sf-hero-btn sf-hero-btn-primary" style={{ background: "#15784C", color: "#fff", height: 48 }} onClick={() => onAdd({ size, color: selectedColor?.name }, qty)}>
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
