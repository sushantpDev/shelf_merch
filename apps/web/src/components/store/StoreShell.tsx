import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { StoreBanner, type StoreShop, BANNER_THEMES } from "../StoreBanner";
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
  if (!box?.widthPct || !box?.heightPct) {
    return {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: "34%",
      height: "34%",
      boxSizing: "border-box",
      overflow: "hidden",
      display: "grid",
      placeItems: "center",
      pointerEvents: "none",
    };
  }
  return {
    position: "absolute",
    left: `${box.xPct}%`,
    top: `${box.yPct}%`,
    width: `${box.widthPct}%`,
    height: `${box.heightPct}%`,
    boxSizing: "border-box",
    overflow: "hidden",
    display: "grid",
    placeItems: "center",
    pointerEvents: "none",
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

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [page]);

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

  const navLink = (label: string, target: Page) => (
    <button
      type="button"
      onClick={() => setPage(target)}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: theme.text,
        opacity: page === target ? 1 : 0.7,
        fontWeight: page === target ? 700 : 500,
        fontSize: 14,
        padding: "4px 2px",
        borderBottom: page === target ? `2px solid ${theme.text}` : "2px solid transparent",
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="store" style={{ background: "var(--bg)" }}>
      {/* Top nav — branded */}
      <div style={{ background: theme.bg, color: theme.text, borderBottom: shop.bannerTheme === "light" || !shop.bannerTheme ? "1px solid var(--line)" : "none" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", gap: 20 }}>
          <button type="button" onClick={() => setPage("home")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", color: theme.text }}>
            <span style={{ width: 34, height: 34, background: "#fff", borderRadius: 8, display: "grid", placeItems: "center", overflow: "hidden", padding: 4 }}>
              {shop.logoUrl ? (
                <img src={shop.logoUrl} alt={shop.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              ) : (
                <span style={{ fontWeight: 800, color: "#15784C", fontSize: 15 }}>{shop.name.charAt(0).toUpperCase()}</span>
              )}
            </span>
            <b style={{ fontSize: 16 }}>{shop.name}</b>
          </button>
          <div style={{ display: "flex", gap: 18, marginLeft: 12 }}>
            {navLink("Home", "home")}
            {navLink("Products", "products")}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
            {mode === "redeem" && creditInr != null && (
              <span style={{ fontSize: 13, opacity: 0.9 }}>
                Balance: <b>{fmt(Math.max(0, creditInr - cartTotalInr))}</b>
              </span>
            )}
            {mode === "redeem" && (
              <button type="button" onClick={() => setPage("cart")} style={{ background: "rgba(255,255,255,.18)", color: theme.text, border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                Cart ({cartCount})
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "32px 24px" }}>
        {error && page !== "checkout" && (
          <div className="card" style={{ padding: 12, marginBottom: 16, color: "var(--danger)" }}>{error}</div>
        )}

        {/* HOME */}
        {page === "home" && (
          <>
            <StoreBanner shop={shop} eyebrow={mode === "redeem" ? "Your reward store" : "Branded store"} />
            <div className="card" style={{ padding: 28, marginBottom: 24 }}>
              <h1 style={{ fontSize: 26, marginBottom: 8 }}>
                {mode === "redeem" ? `Welcome${recipientName ? `, ${recipientName}` : ""} 🎉` : `Welcome to ${shop.name}`}
              </h1>
              <p className="muted" style={{ marginBottom: 16, maxWidth: 560 }}>
                {welcome || (mode === "redeem"
                  ? "Pick your favourites and we'll ship them to you."
                  : "Browse the products available in this branded store.")}
              </p>
              {mode === "redeem" && creditInr != null && (
                <p style={{ marginBottom: 16 }}>
                  You have <b style={{ color: "var(--brand)" }}>{fmt(creditInr)}</b> to spend.
                </p>
              )}
              <button className="btn btn-brand" onClick={() => setPage("products")}>
                Browse products →
              </button>
              {mode === "preview" && (
                <p className="mut3" style={{ fontSize: 12, marginTop: 16 }}>
                  Employees: open your private invite link to redeem your gift.
                </p>
              )}
            </div>
            <h3 style={{ fontSize: 17, marginBottom: 14 }}>Featured</h3>
            <ProductGrid products={products.slice(0, 4)} onOpen={openProduct} fmt={fmt} />
          </>
        )}

        {/* PRODUCTS */}
        {page === "products" && (
          <>
            <h1 style={{ fontSize: 24, marginBottom: 16 }}>Products</h1>
            {categories.length > 1 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                <CategoryChips categories={categories} products={products} onOpen={openProduct} fmt={fmt} />
              </div>
            )}
            {categories.length <= 1 && <ProductGrid products={products} onOpen={openProduct} fmt={fmt} />}
          </>
        )}

        {/* PRODUCT DETAIL */}
        {page === "product" && active && (
          <ProductDetail
            product={active}
            mode={mode}
            fmt={fmt}
            onBack={() => setPage("products")}
            onAdd={(variant, qty) => addToCart(active, variant, qty)}
          />
        )}

        {/* CART */}
        {page === "cart" && (
          <>
            <h1 style={{ fontSize: 24, marginBottom: 16 }}>Your cart</h1>
            {cart.length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: "center" }}>
                <p className="muted" style={{ marginBottom: 16 }}>Your cart is empty.</p>
                <button className="btn btn-brand" onClick={() => setPage("products")}>Browse products</button>
              </div>
            ) : (
              <>
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  {cart.map((l) => (
                    <div key={l.key} className="row" style={{ alignItems: "center", gap: 14, padding: 14, borderBottom: "1px solid var(--line)" }}>
                      <div style={{ width: 56, height: 56, flex: "none", background: "var(--surface-2)", borderRadius: 8, overflow: "hidden", display: "grid", placeItems: "center" }}>
                        {l.image ? <img src={l.image} alt={l.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{l.name}</div>
                        {l.variant && (
                          <div className="mut3" style={{ fontSize: 12 }}>
                            {[l.variant.color, l.variant.size].filter(Boolean).join(" · ")}
                          </div>
                        )}
                        <div className="mut3" style={{ fontSize: 12 }}>{fmt(l.priceInr)} each</div>
                      </div>
                      <input
                        className="inp"
                        type="number"
                        min={0}
                        value={l.qty}
                        onChange={(e) => setLineQty(l.key, Math.max(0, Number(e.target.value)))}
                        style={{ width: 72, height: 36 }}
                      />
                      <div style={{ width: 90, textAlign: "right", fontWeight: 600 }}>{fmt(l.priceInr * l.qty)}</div>
                    </div>
                  ))}
                </div>
                <div className="card" style={{ padding: 20, marginTop: 16 }}>
                  <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                    <span>Subtotal</span>
                    <b>{fmt(cartTotalInr)}</b>
                  </div>
                  {mode === "redeem" && creditInr != null && (
                    <div className="row" style={{ justifyContent: "space-between", color: overBudget ? "var(--danger)" : "var(--ink-2)" }}>
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
                    <button className="btn btn-brand btn-block" style={{ marginTop: 14 }} disabled={overBudget} onClick={() => setPage("checkout")}>
                      Proceed to checkout
                    </button>
                  ) : (
                    <p className="mut3" style={{ fontSize: 12, marginTop: 12 }}>Open your invite link to check out.</p>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* CHECKOUT */}
        {page === "checkout" && (
          <>
            <button type="button" className="lnk" onClick={() => setPage("cart")} style={{ marginBottom: 12 }}>← Back to cart</button>
            <h1 style={{ fontSize: 24, marginBottom: 16 }}>Checkout</h1>
            {error && <div className="card" style={{ padding: 12, marginBottom: 16, color: "var(--danger)" }}>{error}</div>}
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontSize: 16, marginBottom: 14 }}>Shipping address</h3>
              <div className="row" style={{ gap: 12 }}>
                <input className="inp" placeholder="Full name" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} />
                <input className="inp" placeholder="Phone number" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
              </div>
              <input className="inp" placeholder="Address line" style={{ marginTop: 10 }} value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
              <div className="row" style={{ gap: 12, marginTop: 10 }}>
                <input className="inp" placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                <input className="inp" placeholder="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
                <input className="inp" placeholder="PIN" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
              </div>
            </div>
            <div className="card" style={{ padding: 20, marginTop: 16 }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                <span className="muted">{cartCount} item(s)</span>
                <b>{fmt(cartTotalInr)}</b>
              </div>
              <button className="btn btn-brand btn-block" style={{ marginTop: 10 }} disabled={placing || overBudget || cart.length === 0} onClick={placeOrder}>
                {placing ? "Placing order…" : "Place order"}
              </button>
            </div>
          </>
        )}

        {/* DONE */}
        {page === "done" && (
          <div className="card" style={{ padding: 40, textAlign: "center", maxWidth: 520, margin: "40px auto" }}>
            <div className="eyebrow">Order placed</div>
            <h1 style={{ fontSize: 26, margin: "8px 0" }}>Thank you{recipientName ? `, ${recipientName}` : ""}! 🎁</h1>
            <p className="muted">
              Order <b>{orderNumber}</b> is confirmed. We'll email you tracking once it ships.
            </p>
          </div>
        )}

        <p className="muted" style={{ textAlign: "center", marginTop: 40, fontSize: 12 }}>
          Powered by Shelf Merch{mode === "preview" ? " · Recipients redeem from a private invite link." : ""}
        </p>
      </div>
    </div>
  );
}

function ProductGrid({ products, onOpen, fmt }: { products: StoreProduct[]; onOpen: (id: string) => void; fmt: (n: number) => string }) {
  if (products.length === 0) {
    return <div className="card" style={{ padding: 32, textAlign: "center" }}><p className="muted">No products yet.</p></div>;
  }
  return (
    <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}>
      {products.map((p) => {
        const colors = productColorOptions(p);
        return (
          <button key={p._id} type="button" onClick={() => onOpen(p._id)} className="card" style={{ padding: 0, overflow: "hidden", textAlign: "left", cursor: "pointer", border: "1px solid var(--line)", background: "var(--surface)" }}>
            <div className="store-mockup-slot" style={{ aspectRatio: "1 / 1", background: colors[0]?.hex || "#ffffff" }}>
              <ArtworkMockup product={p} />
            </div>
            <div style={{ padding: 14 }}>
              {p.brand && <div className="mut3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em" }}>{p.brand}</div>}
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{p.name}</div>
              <div style={{ marginTop: 6, fontWeight: 700, color: "var(--brand)" }}>{fmt(p.basePriceInr)}</div>
              {colors.length > 0 && (
                <div className="swatches" style={{ marginTop: 8 }}>
                  {colors.slice(0, 4).map((c) => (
                    <span key={c.name} className="sw" style={{ background: c.hex }} title={c.name} />
                  ))}
                  {colors.length > 4 && <span className="mut3" style={{ fontSize: 10, alignSelf: "center" }}>+{colors.length - 4}</span>}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function CategoryChips({ categories, products, onOpen, fmt }: { categories: string[]; products: StoreProduct[]; onOpen: (id: string) => void; fmt: (n: number) => string }) {
  const [sel, setSel] = useState<string>("All");
  const filtered = sel === "All" ? products : products.filter((p) => p.category === sel);
  return (
    <>
      {["All", ...categories].map((c) => (
        <button key={c} type="button" onClick={() => setSel(c)} className={sel === c ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"}>
          {c}
        </button>
      ))}
      <div style={{ flexBasis: "100%", height: 0 }} />
      <div style={{ width: "100%", marginTop: 6 }}>
        <ProductGrid products={filtered} onOpen={onOpen} fmt={fmt} />
      </div>
    </>
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
      <button type="button" className="lnk" onClick={onBack} style={{ marginBottom: 16 }}>← Back to products</button>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>
        <div className="pd-gallery">
          <div className="pd-img" style={{ background: previewBg }}>
            <div className="pd-img-inner pd-img-mockup">
              <ArtworkMockup product={product} />
            </div>
          </div>
          {colorOptions.length > 0 && (
            <div className="pd-colors" style={{ marginTop: 14 }}>
              <div className="lbl" style={{ marginBottom: 10 }}>Color preview</div>
              <ColorSwatches colors={colorOptions} selected={selColor} onSelect={setSelColor} />
            </div>
          )}
        </div>
        <div>
          {product.brand && <div className="mut3" style={{ textTransform: "uppercase", letterSpacing: ".04em", fontSize: 12 }}>{product.brand}</div>}
          <h1 style={{ fontSize: 26, margin: "4px 0 8px" }}>{product.name}</h1>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--brand)", marginBottom: 14 }}>{fmt(product.basePriceInr)}</div>
          {product.description && <p className="muted" style={{ marginBottom: 18 }}>{product.description}</p>}

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
                    style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
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
                  <button key={s} type="button" onClick={() => setSize(s)} className={size === s ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {mode === "redeem" ? (
            <div className="row" style={{ gap: 12, marginTop: 18, alignItems: "center" }}>
              <input className="inp" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} style={{ width: 80 }} />
              <button className="btn btn-brand" onClick={() => onAdd({ size, color: selectedColor?.name }, qty)}>Add to cart</button>
            </div>
          ) : (
            <p className="mut3" style={{ fontSize: 12, marginTop: 18 }}>Open your private invite link to redeem this item.</p>
          )}
        </div>
      </div>
    </>
  );
}
