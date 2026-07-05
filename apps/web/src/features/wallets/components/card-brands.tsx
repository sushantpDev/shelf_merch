export type CardBrand = "visa" | "mastercard" | "amex" | "rupay";

const ALL_BRANDS: CardBrand[] = ["visa", "mastercard", "amex", "rupay"];

const BRAND_ASSETS: Record<CardBrand, { src: string; alt: string }> = {
  visa: { src: "/images/card-brands/visa.png", alt: "Visa" },
  mastercard: { src: "/images/card-brands/mastercard.svg", alt: "Mastercard" },
  amex: { src: "/images/card-brands/amex.png", alt: "American Express" },
  rupay: { src: "/images/card-brands/rupay.png", alt: "RuPay" },
};

/** Detect card network from the digits entered so far. */
export function detectCardBrand(digits: string): CardBrand | null {
  if (!digits) return null;

  if (/^3[47]/.test(digits)) return "amex";
  if (/^4/.test(digits)) return "visa";
  if (/^5[1-5]/.test(digits)) return "mastercard";
  if (/^2(22[1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720)/.test(digits)) return "mastercard";
  if (/^(508[5-9]|508[0-9]{2}|60|65|81|82)/.test(digits)) return "rupay";

  return null;
}

export function cardDigitLimit(brand: CardBrand | null): number {
  return brand === "amex" ? 15 : 16;
}

export function formatCardNumber(raw: string, brand: CardBrand | null): string {
  const digits = raw.replace(/\D/g, "").slice(0, cardDigitLimit(brand));
  if (brand === "amex") {
    const p1 = digits.slice(0, 4);
    const p2 = digits.slice(4, 10);
    const p3 = digits.slice(10, 15);
    return [p1, p2, p3].filter(Boolean).join(" ");
  }
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function CardBrandLogo({ brand }: { brand: CardBrand }) {
  const { src, alt } = BRAND_ASSETS[brand];
  return (
    <img
      src={src}
      alt={alt}
      className={`add-funds-card-brand-icon add-funds-card-brand-icon--${brand}`}
      draggable={false}
    />
  );
}

export function CardBrandIcons({ cardNumber }: { cardNumber: string }) {
  const digits = cardNumber.replace(/\D/g, "");
  const detected = detectCardBrand(digits);
  const brands = detected ? [detected] : ALL_BRANDS;

  return (
    <span className={`add-funds-card-brands${detected ? " detected" : ""}`} aria-hidden="true">
      {brands.map((brand) => (
        <span key={brand} className="add-funds-card-brand" title={BRAND_ASSETS[brand].alt}>
          <CardBrandLogo brand={brand} />
        </span>
      ))}
    </span>
  );
}
