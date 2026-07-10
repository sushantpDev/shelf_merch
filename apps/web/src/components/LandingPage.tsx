import { useState, type ReactNode } from "react";
import "./landing-page.css";
import { Link } from "react-router";
import { ShelfMerchLogo } from "@/components/brand/ShelfMerchLogo";
import type { LucideIcon } from "lucide-react";
import consolidateImg from "../../assets/consolidate.png";
import shelfmerch from "../../assets/shelfmerch.png";
import {
  Award,
  Backpack,
  Briefcase,
  Cake,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Coffee,
  CreditCard,
  CupSoda,
  Dumbbell,
  Eye,
  Factory,
  Gem,
  Gift,
  Globe,
  Hand,
  Handshake,
  Headphones,
  Heart,
  HeartHandshake,
  IdCard,
  Instagram,
  Laptop,
  Linkedin,
  Megaphone,
  Menu,
  MessageCircle,
  Monitor,
  Package,
  PartyPopper,
  Pencil,
  Plane,
  Popcorn,
  Puzzle,
  Rocket,
  Search,
  Settings,
  Shirt,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Target,
  Tent,
  TrendingUp,
  Truck,
  User,
  UserCircle,
  Users,
  Wallet,
  Youtube,
} from "lucide-react";

const LP_ICONS = {
  monitor: Monitor,
  package: Package,
  star: Star,
  backpack: Backpack,
  "shopping-bag": ShoppingBag,
  factory: Factory,
  puzzle: Puzzle,
  gift: Gift,
  party: PartyPopper,
  coffee: Coffee,
} as const satisfies Record<string, LucideIcon>;

type CardIconKey = keyof typeof LP_ICONS;

function LpIcon({
  icon: Icon,
  size = 20,
  className,
  strokeWidth = 2,
}: {
  icon: LucideIcon;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return <Icon size={size} className={className} strokeWidth={strokeWidth} aria-hidden />;
}

function LpSectionHeader({
  badge,
  title,
  sub,
  align = "center",
}: {
  badge: string;
  title: ReactNode;
  sub?: string;
  align?: "center" | "left";
}) {
  return (
    <header className={`lp-section-header${align === "left" ? " lp-section-header--left" : ""}`}>
      <span className="lp-hero__badge">{badge}</span>
      <h2 className="lp-section-header__title">{title}</h2>
      {sub ? <p className="lp-section-header__sub">{sub}</p> : null}
    </header>
  );
}

const HERO_NAV_LINKS = [
  { label: "Products", href: "#products", chevron: true },
  { label: "Solutions", href: "#solutions", chevron: true },
  { label: "Pricing", href: "#pricing", chevron: false },
  { label: "Resources", href: "#resources", chevron: true },
] as const;

const HERO_TRUST_ITEMS: { icon: LucideIcon; label: string }[] = [
  { icon: CheckCircle2, label: "100% risk-free" },
  { icon: Truck, label: "No inventory" },
  { icon: Globe, label: "Global fulfillment" },
  { icon: Headphones, label: "Expert support" },
];

const HERO_BANNER_IMAGE = "/images/landing/corporate-gifting-hero.png?v=2";

const CONSOLIDATE_ICONS: { icon: LucideIcon; color: string }[] = [
  { icon: Gift, color: "#7C3AED" },
  { icon: Award, color: "#2563EB" },
  { icon: Package, color: "#0D9488" },
  { icon: Heart, color: "#F59E0B" },
  { icon: Calendar, color: "#F97316" },
  { icon: Megaphone, color: "#EC4899" },
  { icon: Star, color: "#6366F1" },
];

const GIFTING_HERO_IMAGE = "/images/offerings/gifting/gifting-journey-hq.png?v=3";

const GIFTING_FEATURES = [
  "Clients & Prospects",
  "Holidays & Celebrations",
  "Employee Appreciation",
  "Birthdays",
] as const;

const FOOTER_COLUMNS = [
  {
    title: "Products",
    links: ["Shops", "Gifting", "Swag", "Snacks", "Gift Cards", "Send Points"],
  },
  {
    title: "Platform",
    links: ["Integrations", "API", "Kudos Program", "Custom Shops", "Analytics", "Wallet"],
  },
  {
    title: "Resources",
    links: ["Help Center", "Blog", "Case Studies", "Partnerships", "Videos", "Contact Us"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Press", "Reviews", "Partner With Us"],
  },
  {
    title: "Legal",
    links: ["Privacy Policy", "Terms of Service", "Security", "Cookie Preferences"],
  },
] as const;

const FOOTER_OFFERINGS: { label: string; icon: LucideIcon }[] = [
  { label: "Shops", icon: Store },
  { label: "Gifting", icon: Gift },
  { label: "Kudos", icon: Heart },
];

/* ─── offerings tabs (ShelfMerch) ─── */
const OFFERING_TABS = [
  {
    id: "shops",
    label: "Shops",
    icon: "/images/offering-icons/shops.svg",
    color: "#7c3aed",
    bg: "#f3e8ff",
    bgDark: "#5b21b6",
    title: "Do it all with your shop",
    sub: "Launch a branded storefront with customizable swag, flexible rewards, and thousands of catalog options.",
    layout: "shop" as const,
    perfectFor: [
      "Company Storefront",
      "Swag & Uniform Shops",
      "Corporate Gifts",
      "Rewards Redemption",
      "Retail",
      "Recognition & Incentives",
      "Fundraising",
    ],
    features: ["Add your branding", "Curated catalog", "Points or currency", "5K+ product options"],
  },
  {
    id: "anniversaries",
    label: "Service Anniversaries",
    icon: "/images/offering-icons/anniversaries.svg",
    color: "#2563eb",
    bg: "#eef4fc",
    bgDark: "#1e40af",
    title: "Celebrate milestones across your team",
    layout: "anniversaries" as const,
    features: ["Service Anniversaries", "Employee Appreciation", "Rewards Redemption", "Sales Incentives"],
  },
  {
    id: "events",
    label: "In-Person & Events",
    icon: "/images/offering-icons/events.svg",
    color: "#B8872E",
    bg: "#faf6ee",
    bgDark: "#8a6520",
    title: "Elevate your in-person experience",
    layout: "cards" as const,
    cards: [
      { iconKey: "monitor", title: "Virtual Swag Bar", desc: "Let attendees pick their favorites." },
      { iconKey: "package", title: "Bulk Swag", desc: "Ship branded gear to any venue." },
      { iconKey: "star", title: "VIP Gifts", desc: "Premium gifts for key guests." },
      { iconKey: "backpack", title: "Goodie Bags & Cases", desc: "Ready-to-hand event kits." },
    ],
    features: ["Upload Your Booth", "Capture Leads", "Room Drops", "Pre- & Post-Event Engagement"],
  },
  {
    id: "kudos",
    label: "Employee Kudos",
    icon: "/images/offering-icons/kudos.svg",
    color: "#C45C6A",
    bg: "#faf4f5",
    bgDark: "#a84855",
    title: "Empower recognition with top incentives",
    layout: "kudos" as const,
    bullets: [
      "Employee-to-employee recognition",
      "Assign monetary value to kudos or keep them free",
      "Integrate with Teams, Slack, or use our platform",
      "Thousands of gifts from top brands + customizable swag",
      "Enable kudos to flow freely across your org chart",
    ],
    features: ["Peer Recognition", "Manager Awards", "Budget Controls", "Redemption Tracking"],
  },
  {
    id: "swag",
    label: "Swag",
    icon: "/images/offering-icons/swag.svg",
    color: "#00C036",
    bg: "#f0fdfa",
    bgDark: "#0f766e",
    title: "The only swag partner you need",
    layout: "brands" as const,
    cards: [
      { iconKey: "star", title: "VIP Gifts", desc: "Premium branded items." },
      { iconKey: "monitor", title: "Virtual Swag Bar", desc: "Online pick-and-pack." },
      { iconKey: "package", title: "Kits", desc: "Onboarding & celebration kits." },
      { iconKey: "shopping-bag", title: "On-Demand Shops", desc: "Launch stores in minutes." },
      { iconKey: "factory", title: "Bulk Swag", desc: "Volume orders, one platform." },
    ],
    features: ["Global Fulfillment", "Endless Customization", "Storage", "Sustainable Practices", "5K+ Items"],
    brands: ["Nike", "Carhartt", "North Face", "BELLA+CANVAS", "Columbia", "Adidas", "Port Authority"],
  },
  {
    id: "snacks",
    label: "Snacks",
    icon: "/images/offering-icons/snacks.svg",
    color: "#2D7A5F",
    bg: "#eef5f2",
    bgDark: "#1a5c47",
    title: "Snacks and sips in all the ways",
    layout: "brands" as const,
    cards: [
      { iconKey: "puzzle", title: "Build-Your-Own", desc: "Customize every box." },
      { iconKey: "gift", title: "Curated Boxes", desc: "Expertly assembled selections." },
      { iconKey: "shopping-bag", title: "Goodie Bags", desc: "Individual treats at scale." },
      { iconKey: "party", title: "Surprise Boxes", desc: "Delight with the unexpected." },
      { iconKey: "coffee", title: "Pantry Refills", desc: "Keep offices stocked." },
    ],
    features: ["Global Fulfillment", "Box Customizations", "Add Branding", "Add Swag", "Sustainable Practices"],
    brands: ["Hippeas", "Pipcorn", "Hu", "Siete", "Kettle Brand"],
  },
] as const;

type OfferingId = (typeof OFFERING_TABS)[number]["id"];

const ANNIVERSARY_CARDS = [
  {
    title: "Spot & Recurring",
    desc: "Give once or set ongoing recognition.",
    image: "/images/offerings/anniversaries/spot-recurring.png",
  },
  {
    title: "Feedback & Reporting",
    desc: "Guardrails, analytics, and insights.",
    image: "/images/offerings/anniversaries/feedback-reporting.png",
  },
  {
    title: "Integrations",
    desc: "HRIS, CRM, Slack, Teams, and more.",
    image: "/images/offerings/anniversaries/integrations.png",
  },
] as const;

const SHOP_HERO_IMAGE = "/images/shops/shop-preview-happy-summer.png";

const SHOP_CALLOUTS = [
  { id: "branding", label: "ADD YOUR BRANDING", side: "left" as const, pos: "top" as const },
  { id: "swag", label: "CUSTOMIZABLE SWAG FROM TOP BRANDS", side: "left" as const, pos: "bottom" as const },
  { id: "points", label: "POINTS, CURRENCY, OR PRICELESS", side: "right" as const, pos: "top" as const },
  { id: "catalog", label: "5K+ CATALOG OPTIONS", side: "right" as const, pos: "bottom" as const },
];

function ShopCalloutArrow({ flip }: { flip?: boolean }) {
  return (
    <svg
      className={`lp-shop-callout__arrow${flip ? " lp-shop-callout__arrow--flip" : ""}`}
      viewBox="0 0 48 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 16 C12 4, 28 6, 44 14"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M36 10 L44 14 L38 20"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── data ─── */
const TEAMS = [
  {
    id: "hr",
    label: "Human Resources",
    icon: Users,
    title: "Empower Your Employees",
    desc: "Optimize HR processes, recognize employees, and nurture the employee experience with ShelfMerch.",
    benefits: [
      "Onboard employees with an onboarding shop or swag kits.",
      "Create automations to send gifts for work anniversaries and milestones.",
      "Boost company culture with a kudos program.",
    ],
    theme: { bg: "#5B4589", card: "#F3EEF8", tabBg: "#F3EEF8", tabBorder: "#7C5CBF", cardText: "#3D2E5C" },
  },
  {
    id: "marketing",
    label: "Marketing & Branding",
    icon: Megaphone,
    title: "Enrich your marketing efforts",
    desc: "Increase brand awareness, boost marketing campaigns, and attract new customers with ShelfMerch.",
    benefits: [
      "Avoid employees or customers going rogue with non-approved logos.",
      "Easily rebrand your swag and gifts in just a few clicks with a swag shop.",
      "Run coordinated gift campaigns for clients.",
      "Attract partners and vendors worldwide with swag and gifts.",
    ],
    theme: { bg: "#7A2D3E", card: "#FDE8EC", tabBg: "#FDE8EC", tabBorder: "#E85D7A", cardText: "#5C2030" },
  },
  {
    id: "leaders",
    label: "Team Leaders",
    icon: Target,
    title: "Shape company culture with rewards",
    desc: "Foster a positive team culture with rewards, recognition, and gifting.",
    benefits: [
      "Allocate and track funds across your team for easy spending.",
      "Reward your team for a job well done with snacks, swag, and more.",
      "Enhance team morale with a kudos program.",
    ],
    theme: { bg: "#3D6B52", card: "#E8F5EC", tabBg: "#E8F5EC", tabBorder: "#4A9B6E", cardText: "#1F4A35" },
  },
  {
    id: "sales",
    label: "Sales",
    icon: Briefcase,
    title: "Lead your sales team to success",
    desc: "Equip your sales team with the tools they need to secure wins.",
    benefits: [
      "Attract and nurture prospects by sending a gift.",
      "Show your client appreciation by gifting them top-tier swag.",
      "Celebrate sales wins with our catalog of snacks, swag, and more.",
    ],
    theme: { bg: "#5C5620", card: "#FAF6E5", tabBg: "#FAF6E5", tabBorder: "#C9A227", cardText: "#3D3814" },
  },
  {
    id: "ops",
    label: "Operations",
    icon: Settings,
    title: "Streamline your company's processes",
    desc: "Use ShelfMerch to take your processes to the next level, from onboarding to performance goals.",
    benefits: [
      "Create a swag shop for uniforms, supplies, and more.",
      "Onboard at scale with swag kits.",
      "Store, distribute, and organize your swag inventory with ShelfMerch.",
      "Centralize all your approved designs.",
    ],
    theme: { bg: "#2B4F6E", card: "#E8F0FA", tabBg: "#E8F0FA", tabBorder: "#4A7EB5", cardText: "#1A3348" },
  },
  {
    id: "events",
    label: "Event Managers",
    icon: Tent,
    title: "Make every event remarkable",
    desc: "Every aspect of the event matters! Ensure a memorable experience with gifts they'll love.",
    benefits: [
      "Pair any event (virtual or in-person) with epic snacks and swag to match.",
      "Gift attendees before, during, or after the event.",
      "Collect leads at scale using our Scan for Swag feature.",
      "Award attendees with redeemable points to your shop.",
    ],
    theme: { bg: "#2D6B4F", card: "#E5F5EB", tabBg: "#E5F5EB", tabBorder: "#3D9B6A", cardText: "#1A4A35" },
  },
] as const;

const CATEGORIES = [
  { title: "Food & Beverages", img: "/images/landing/categories/food-beverages.png" },
  { title: "Luxury", img: "/images/landing/categories/luxury.png" },
  { title: "Wellness", img: "/images/landing/categories/wellness.png" },
  { title: "Gift Cards", img: "/images/landing/categories/gift-cards.png" },
  { title: "Work & Essentials", img: "/images/landing/categories/work-essentials.png" },
  { title: "Apparel & Wearables", img: "/images/landing/categories/apparel-wearables.png", bleed: true },
  { title: "Life & Hobbies", img: "/images/landing/categories/life-hobbies.png" },
  { title: "Experiences", img: "/images/landing/categories/experiences.png" },
] as const;

const USE_CASES: { label: string; icon: LucideIcon }[] = [
  { label: "Employee Appreciation", icon: Star },
  { label: "Incentives", icon: Target },
  { label: "Work Anniversaries", icon: Calendar },
  { label: "Awards", icon: Award },
  { label: "Work From Home Stipend", icon: Laptop },
  { label: "Rewards Redemption", icon: Award },
  { label: "Employee Birthday Treats", icon: Cake },
  { label: "Swag Store Redemption", icon: ShoppingBag },
  { label: "Boosting Morale", icon: Rocket },
  { label: "Kudos Program", icon: Users },
  { label: "Swag Distribution", icon: Package },
  { label: "Snack Perks", icon: Popcorn },
  { label: "Recurring Perks", icon: Calendar },
  { label: "Boosting Attendance", icon: TrendingUp },
  { label: "New Hire Welcome", icon: Hand },
  { label: "Client Gifting", icon: Gift },
  { label: "Prospecting", icon: Search },
  { label: "Celebration Shops", icon: Store },
  { label: "Boosting Response Rates", icon: MessageCircle },
  { label: "Recognizing DEI Events", icon: HeartHandshake },
];

const FEATURE_QUOTE =
  "Saying goodbye to 9 vendors allowed us to reinvest our budget into experiences you actually love.";

const TESTIMONIALS = [
  {
    content:
      "ShelfMerch solved our remote gifting problem by being flexible, personal, and stress-free for our admins.",
    name: "Patty L",
    role: "MARQETA | SR. EXECUTIVE ASSISTANT",
  },
  {
    content:
      "We consolidated swag, kits, and recognition into one workspace. Our team actually uses what we send now.",
    name: "Jordan M",
    role: "NOTION | PEOPLE OPERATIONS",
  },
  {
    content:
      "From onboarding kits to milestone gifts, ShelfMerch makes it easy to show appreciation at scale without the logistics headache.",
    name: "Rina K",
    role: "FIGMA | EMPLOYEE EXPERIENCE",
  },
] as const;

const TRUSTED_LOGOS = [
  { name: "Google", src: "/images/logos/google-wordmark.svg", width: 92, height: 32 },
  { name: "YouTube", src: "/images/logos/youtube-wordmark.svg", width: 108, height: 32 },
  { name: "Spotify", src: "/images/logos/spotify-wordmark.svg", width: 104, height: 32 },
  { name: "Airbnb", src: "/images/logos/airbnb-wordmark.svg", width: 104, height: 32 },
  { name: "Slack", src: "/images/logos/slack-wordmark.svg", width: 112, height: 32 },
  { name: "HubSpot", src: "/images/logos/hubspot-wordmark.svg", width: 124, height: 32 },
] as const;

const KUDOS_FEED = [
  { initials: "PS", name: "Priya S.", action: "sent kudos", message: "Great work on the launch!", points: 15, tone: "#C45C6A" },
  { initials: "MK", name: "Marcus K.", action: "shout-out", message: "Thanks for going the extra mile.", points: 10, tone: "#A84855" },
  { initials: "AL", name: "Alex L.", action: "recognized", message: "Crushed the client demo today.", points: 20, tone: "#B85A68" },
] as const;

/* ─── component ─── */
export default function LandingPage() {
  const [offering, setOffering] = useState<OfferingId>("shops");
  const [team, setTeam] = useState<(typeof TEAMS)[number]["id"]>("hr");
  const activeTeam = TEAMS.find((t) => t.id === team)!;
  const activeOffering = OFFERING_TABS.find((t) => t.id === offering)!;

  return (
    <div className="lp">
      {/* ── NAV ── */}
      <header className="lp-nav lp-nav--merch">
        <div className="lp-container lp-nav__inner lp-nav__inner--merch">
          <a href="/" className="lp-logo">
            {/* <ShelfMerchLogo height={44} className="lp-logo__img lp-logo__img--merch" /> */}
            <img src={shelfmerch} alt="Shelf Merch logo" className="h-6 w-48" loading="eager" />
          </a>

          <nav className="lp-nav__links lp-nav__links--merch">
            {HERO_NAV_LINKS.map((item) => (
              <a key={item.label} href={item.href}>
                <span>{item.label}</span>
                {item.chevron ? <ChevronDown className="lp-nav__chevron" aria-hidden /> : null}
              </a>
            ))}
          </nav>

          <div className="lp-nav__actions lp-nav__actions--merch">
            <Link to="/login" className="lp-btn-primary lp-btn-primary-sm lp-btn-pill">
              Log in
            </Link>
            <Link to="/signup" className="lp-btn-primary lp-btn-primary-sm lp-btn-pill">
              Get started
            </Link>
          </div>

          <button type="button" className="lp-nav__menu" aria-label="Open navigation">
            <Menu className="lp-nav__menu-icon" aria-hidden />
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <div className="lp-hero-zone lp-hero-zone--merch lp-hero-zone--banner">
        <section className="lp-hero lp-hero--merch lp-hero--banner">
          <img
            src={HERO_BANNER_IMAGE}
            alt=""
            className="lp-hero-banner__img"
            width={8688}
            height={2896}
            aria-hidden="true"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <div className="lp-hero--merch__inner">
            <div className="lp-hero__content lp-hero__content--merch lp-hero__content--banner">
              <p className="lp-hero__eyebrow">Recognition · Swag · Gifting</p>

              <h1 className="lp-hero__headline">
                <span className="lp-hero__tone-orange">Celebrate your people.</span>
                <br />
                <span className="lp-hero__tone-blue">One platform.</span>
              </h1>

              <p className="lp-hero__lede">
                <span className="lp-hero__tone-orange">
                  Launch branded shops, send corporate gifts, and reward teams
                </span>
                <br className="lp-hero__lede-br" />
                <span className="lp-hero__tone-blue">
                  with premium swag—all from one gifting workspace.
                </span>
              </p>

              <div className="lp-hero__ctas lp-hero__ctas--merch lp-hero__ctas--banner">
                <Link to="/signup" className="lp-btn-primary lp-btn-pill">
                  Get started for free
                </Link>
                <a href="#gifting" className="lp-btn-outline-green">
                  Book a demo
                </a>
              </div>

              <ul className="lp-hero__trust">
                {HERO_TRUST_ITEMS.map((item, index) => (
                  <li key={item.label}>
                    {index > 0 ? <span className="lp-hero__trust-sep" aria-hidden /> : null}
                    <LpIcon icon={item.icon} size={14} className="lp-hero__trust-icon" strokeWidth={2} />
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* ── OFFERINGS TABS ── */}
      <section className="lp-section lp-offerings" id="products">
        <div className="lp-container">
          <header className="lp-offerings__header">
            <p className="lp-offerings__eyebrow">Our Offerings</p>
            <h2 className="lp-offerings__title">Supercharge Your Engagement</h2>
            <p className="lp-offerings__sub">
              Our offerings and curated swag catalog will take your engagement to new heights.
            </p>
          </header>

          <div className="lp-offerings__shell">
          <div className="lp-offerings-tabs" role="tablist" aria-label="ShelfMerch offerings">
            {OFFERING_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={offering === tab.id}
                className={`lp-offerings-tab${offering === tab.id ? " is-active" : ""}`}
                onClick={() => setOffering(tab.id)}
                style={{ "--tab-accent": tab.color } as React.CSSProperties}
              >
                <img
                  src={tab.icon}
                  alt=""
                  className="lp-offerings-tab__icon"
                  width={38}
                  height={38}
                  loading="eager"
                  decoding="async"
                />
                <span className="lp-offerings-tab__label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div
            className="lp-offerings-panel"
            role="tabpanel"
            style={{ "--panel-bg": activeOffering.bg, "--panel-accent": activeOffering.bgDark } as React.CSSProperties}
          >
            <h3 className="lp-offerings-panel__title">{activeOffering.title}</h3>
            {"sub" in activeOffering && activeOffering.sub ? (
              <p className="lp-offerings-panel__sub">{activeOffering.sub}</p>
            ) : null}

            {activeOffering.layout === "shop" && (
              <div className="lp-offerings-shop">
                <div className="lp-shop-showcase">
                  {SHOP_CALLOUTS.map((callout) => (
                    <div
                      key={callout.id}
                      className={`lp-shop-callout lp-shop-callout--${callout.side} lp-shop-callout--${callout.pos}`}
                    >
                      {callout.side === "left" && <ShopCalloutArrow />}
                      <span className="lp-shop-callout__label">{callout.label}</span>
                      {callout.side === "right" && <ShopCalloutArrow flip />}
                    </div>
                  ))}
                  <div className="lp-shop-hero">
                    <img
                      src={SHOP_HERO_IMAGE}
                      alt="Shelf Merch company shop with Happy Summer rewards banner, points, and featured products"
                      width={2149}
                      height={1031}
                      className="lp-shop-hero__img"
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                </div>

                <aside className="lp-offerings-perfect lp-offerings-perfect--shop">
                  <h4>Perfect for:</h4>
                  <ul>
                    {activeOffering.perfectFor?.map((item) => (
                      <li key={item}>
                        <span className="lp-offerings-perfect__check" aria-hidden="true">
                          <Check size={10} strokeWidth={3} />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link to="/app/shops" className="lp-offerings-learn">Learn More</Link>
                </aside>
              </div>
            )}

            {activeOffering.layout === "anniversaries" && (
              <div className="lp-anniv" aria-label="Service anniversaries features">
                <div className="lp-anniv__grid">
                  {ANNIVERSARY_CARDS.map((card) => (
                    <article key={card.title} className="lp-anniv__card">
                      <h4 className="lp-anniv__card-title">{card.title}</h4>
                      <div className="lp-anniv__visual">
                        <img
                          src={card.image}
                          alt=""
                          width={400}
                          height={320}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <p className="lp-anniv__card-desc">{card.desc}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {activeOffering.layout === "cards" && activeOffering.cards && (
              <div className="lp-offerings-cards">
                {activeOffering.cards.map((card) => (
                  <div key={card.title} className="lp-offerings-card">
                    <div className="lp-offerings-card__visual">
                      {"iconKey" in card && (
                        <LpIcon icon={LP_ICONS[card.iconKey as CardIconKey]} size={28} strokeWidth={1.75} />
                      )}
                    </div>
                    <h4>{card.title}</h4>
                    {card.desc && <p>{card.desc}</p>}
                  </div>
                ))}
              </div>
            )}

            {activeOffering.layout === "kudos" && activeOffering.bullets && (
              <div className="lp-offerings-kudos">
                <ul className="lp-offerings-kudos__list">
                  {activeOffering.bullets.map((b) => (
                    <li key={b}>
                      <span className="lp-offerings-kudos__check">
                        <Check size={12} strokeWidth={2.75} />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>

                <div className="lp-kudos-preview" aria-label="Kudos activity preview">
                  <div className="lp-kudos-preview__head">
                    <div className="lp-kudos-preview__title">
                      <span className="lp-kudos-preview__title-icon"><Heart size={16} fill="currentColor" strokeWidth={0} /></span>
                      Team Kudos
                    </div>
                    <span className="lp-kudos-preview__live">Live</span>
                  </div>

                  <div className="lp-kudos-preview__feed">
                    {KUDOS_FEED.map((item) => (
                      <article key={item.initials} className="lp-kudos-preview__item">
                        <span className="lp-kudos-preview__avatar" style={{ background: `${item.tone}18`, color: item.tone }}>
                          {item.initials}
                        </span>
                        <div className="lp-kudos-preview__body">
                          <p className="lp-kudos-preview__meta">
                            <strong>{item.name}</strong> {item.action}
                          </p>
                          <p className="lp-kudos-preview__msg">{item.message}</p>
                        </div>
                        <span className="lp-kudos-preview__pts">+{item.points}</span>
                      </article>
                    ))}
                  </div>

                  <div className="lp-kudos-preview__footer">
                    <div>
                      <strong>2.4k</strong>
                      <span>kudos this month</span>
                    </div>
                    <div>
                      <strong>89%</strong>
                      <span>team participation</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeOffering.layout === "brands" && activeOffering.cards && (
              <>
                <div className="lp-offerings-cards lp-offerings-cards--5">
                  {activeOffering.cards.map((card) => (
                    <div key={card.title} className="lp-offerings-card">
                      <div className="lp-offerings-card__visual">
                        {"iconKey" in card && (
                          <LpIcon icon={LP_ICONS[card.iconKey as CardIconKey]} size={28} strokeWidth={1.75} />
                        )}
                      </div>
                      <h4>{card.title}</h4>
                      {card.desc && <p>{card.desc}</p>}
                    </div>
                  ))}
                </div>
                {activeOffering.brands && (
                  <div className="lp-offerings-brands">
                    {activeOffering.brands.map((b) => (
                      <span key={b}>{b}</span>
                    ))}
                    <span className="lp-offerings-brands__more">+ Many more</span>
                  </div>
                )}
              </>
            )}

            {activeOffering.layout !== "shop" && (
              <div className="lp-offerings-panel__cta">
                <Link to="/app" className="lp-offerings-learn">Learn More →</Link>
              </div>
            )}
          </div>

          {activeOffering.features && activeOffering.layout !== "shop" && (
            <ul className={`lp-offerings-footer${activeOffering.layout === "anniversaries" ? " lp-offerings-footer--anniversaries" : ""}${activeOffering.layout === "kudos" ? " lp-offerings-footer--kudos" : ""}`}>
              {activeOffering.features.map((f) => (
                <li key={f}>
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="8" fill="currentColor" fillOpacity=".12" />
                    <path d="M5 8.2 7 10.2 11 6.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          )}
          </div>
        </div>
      </section>

      {/* ── GIFTING ── */}
      {/* <section className="lp-section lp-gifting" id="gifting">
        <div className="lp-container">
          <header className="lp-gifting__header">
            <p className="lp-gifting__eyebrow">Gifting</p>
            <h2 className="lp-gifting__title">All your gifting operations in one place</h2>
          </header>

          <div className="lp-gifting__panel">
            <div className="lp-gifting__hero">
              <img
                src={GIFTING_HERO_IMAGE}
                alt="Corporate gifting journey — choose gift, add branding, pack, ship, and happy delivery"
                width={6688}
                height={3764}
                className="lp-gifting__hero-img"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
              />
            </div>

            <ul className="lp-gifting__features">
              {GIFTING_FEATURES.map((feature) => (
                <li key={feature}>
                  <Check size={14} strokeWidth={2.5} aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="lp-gifting__cta">
              <Link to="/app" className="lp-btn-primary">
                Explore gifting
                <ChevronRight size={18} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section> */}

      {/* ── SOCIAL PROOF ── */}
      <section className="lp-section lp-social">
        <div className="lp-container">
          <div className="lp-social__layout">
            <div className="lp-social__copy">
              <p className="lp-social__label">For every possible occasion</p>
              <h2 className="lp-social__title">Loved by teams everywhere</h2>
            </div>
            <div className="lp-social__logos" aria-label="Companies using Shelf Merch">
              {TRUSTED_LOGOS.map((logo) => (
                <span key={logo.name} className="lp-social__logo" title={logo.name}>
                  <img
                    src={logo.src}
                    alt={logo.name}
                    width={logo.width}
                    height={logo.height}
                    loading="lazy"
                    decoding="async"
                  />
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="lp-section lp-categories-section" id="solutions">
        <div className="lp-container">
          <header className="lp-categories-header">
            <p className="lp-categories-eyebrow">For everyone</p>
            <h2 className="lp-categories-title">
              Something for <span className="lp-categories-title__accent">Everyone</span>
            </h2>
            <p className="lp-categories-sub">
              Discover unlimited possibilities with our catalog. From snacks to swag, we&apos;ve got it all.
            </p>
          </header>

          <div className="lp-categories">
            {CATEGORIES.map((c) => (
              <Link
                key={c.title}
                to="/app/catalog"
                className={`lp-cat-card${"bleed" in c && c.bleed ? " lp-cat-card--bleed" : ""}`}
                aria-label={`Browse ${c.title}`}
              >
                <img src={c.img} alt="" width={600} height={600} loading="lazy" decoding="async" />
              </Link>
            ))}
          </div>

          <div className="lp-categories__cta">
            <Link to="/app/catalog" className="lp-btn-primary lp-categories__btn">
              View Catalog
              <ChevronRight size={18} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* ── VENDOR CONSOLIDATION ── */}
      <section className="lp-consolidate" id="integrations" aria-label="Vendor consolidation">
        <img
          src={consolidateImg}
          alt="Consolidate all your gifting, swag, and recognition vendors"
          className="lp-consolidate__img"
          width={7932}
          height={3172}
          loading="lazy"
          decoding="async"
        />
      </section>

      {/* ── TEAMS TABS ── */}
      <section className="lp-section lp-teams-section" id="teams">
        <div className="lp-container">
          <header className="lp-teams-header">
            <h2 className="lp-teams-title">One solution for all your teams</h2>
          </header>

          <div className="lp-teams-shell">
            <nav className="lp-teams-nav" aria-label="Teams">
              {TEAMS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`lp-teams-nav__item${team === t.id ? " is-active" : ""}`}
                  onClick={() => setTeam(t.id)}
                  aria-pressed={team === t.id}
                  style={
                    team === t.id
                      ? ({
                          background: t.theme.tabBg,
                          borderLeftColor: t.theme.tabBorder,
                          borderBottomColor: t.theme.tabBorder,
                          color: t.theme.cardText,
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  {t.label}
                </button>
              ))}
            </nav>

            <div
              className="lp-teams-stage"
              key={activeTeam.id}
              style={{ background: activeTeam.theme.bg }}
            >
              <div className="lp-teams-stage__copy">
                <div className="lp-teams-stage__icon" aria-hidden>
                  <LpIcon icon={activeTeam.icon} size={44} strokeWidth={1.5} />
                </div>
                <h3 className="lp-teams-stage__title">{activeTeam.title}</h3>
                <p className="lp-teams-stage__desc">{activeTeam.desc}</p>
                <Link to="/app/catalog" className="lp-teams-stage__link">
                  Learn more
                </Link>
              </div>

              <div
                className="lp-teams-stage__card"
                style={{ background: activeTeam.theme.card, color: activeTeam.theme.cardText }}
              >
                <ul className="lp-teams-stage__list">
                  {activeTeam.benefits.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE QUOTE ── */}
      <section className="lp-feature-quote" aria-label="Customer quote">
        <blockquote className="lp-feature-quote__inner">
          <p>&ldquo;{FEATURE_QUOTE}&rdquo;</p>
        </blockquote>
        <div className="lp-feature-quote__stripe" aria-hidden="true" />
      </section>

      {/* ── USE CASES ── */}
      <section className="lp-section lp-usecases">
        <div className="lp-container">
          <header className="lp-usecases-header">
            <p className="lp-usecases-eyebrow">Unlimited use cases</p>
            <h2 className="lp-usecases-title">Shelf Merch for every occasion</h2>
          </header>

          <div className="lp-usecases-grid">
            {USE_CASES.map((uc) => (
              <div key={uc.label} className="lp-usecase-card">
                <span className="lp-usecase-card__icon">
                  <LpIcon icon={uc.icon} size={20} strokeWidth={1.75} />
                </span>
                <span className="lp-usecase-card__label">{uc.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FLEXIBILITY ── */}
      {/* <section className="lp-section lp-flex-section" id="pricing">
        <div className="lp-container">
          <LpSectionHeader
            badge="Total Flexibility"
            title={<>You choose <span className="c-gold">what to give</span> (or not!)</>}
            sub="Selecting gift or reward items doesn't have to be up to you—unless you want it to be."
          />
          <div className="lp-flex-grid">
            <div className="lp-flex-card lp-shell">
              <div className="lp-flex-card__icon" style={{ background: "rgba(204,231,201,.65)", color: "var(--lp-green)" }}><LpIcon icon={Gift} size={24} /></div>
              <h3>Recipient's Choice</h3>
              <p>Give recipients points or a budget, and let them choose the reward they want.</p>
              <div className="lp-diagram">
                <div className="lp-diagram__avatar"><User size={18} /></div>
                <div className="lp-diagram__arrow">→</div>
                <div className="lp-diagram__badge"><Star size={12} fill="currentColor" strokeWidth={0} /> 2,500 PTS TO SPEND</div>
                <div className="lp-diagram__branch">
                  <span><ShoppingBag size={14} /></span><span><Gift size={14} /></span><span><CreditCard size={14} /></span>
                </div>
              </div>
            </div>
            <div className="lp-flex-card lp-shell">
              <div className="lp-flex-card__icon" style={{ background: "rgba(212,162,76,.18)", color: "var(--lp-gold-strong)" }}><LpIcon icon={ShoppingBag} size={24} /></div>
              <h3>Sender's Choice</h3>
              <p>Give recipients specific items of your choosing from our catalog.</p>
              <div className="lp-diagram">
                <div className="lp-diagram__avatar"><User size={18} /></div>
                <div className="lp-diagram__arrow">→</div>
                <div className="lp-diagram__box">
                  <span><Backpack size={14} /></span><span><Coffee size={14} /></span><span><CupSoda size={14} /></span>
                </div>
                <div className="lp-diagram__branch">
                  <span><User size={14} /></span><span><User size={14} /></span><span><User size={14} /></span>
                </div>
              </div>
            </div>
            <div className="lp-flex-card lp-shell">
              <div className="lp-flex-card__icon" style={{ background: "rgba(21,128,61,.12)", color: "var(--lp-green-mid)" }}><LpIcon icon={Users} size={24} /></div>
              <h3>Employee-to-Employee</h3>
              <p>Let employees reward one another with points or a budget they can redeem for cool stuff.</p>
              <div className="lp-diagram lp-diagram--circle">
                <div className="lp-diagram__kudos"><Star size={12} fill="currentColor" strokeWidth={0} /> 10 KUDOS TO SHARE</div>
                <div className="lp-diagram__avatars">
                  <span><User size={14} /></span><span><User size={14} /></span><span><User size={14} /></span><span><User size={14} /></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* ── TESTIMONIALS ── */}
      <section className="lp-section lp-testimonials" id="resources">
        <div className="lp-container">
          <header className="lp-testimonials-header">
            <p className="lp-testimonials-eyebrow">Hear it from our customers</p>
            <h2 className="lp-testimonials-title">What keeps &apos;em coming</h2>
          </header>

          <div className="lp-testimonials-grid">
            {TESTIMONIALS.map((t) => (
              <article key={t.name} className="lp-testimonial-card">
                <div className="lp-testimonial-card__quote" aria-hidden="true">
                  <svg viewBox="0 0 32 24" width="32" height="24" fill="none">
                    <path
                      d="M0 24V14.4C0 8.8 1.6 4.5 4.8 1.5 6.4.5 8.1 0 10 0v4.8c-2.1.3-3.6 1.2-4.5 2.7-.6 1-.9 2.2-.9 3.5h5.4V24H0zm18 0V14.4c0-5.6 1.6-9.9 4.8-12.9C24.4.5 26.1 0 28 0v4.8c-2.1.3-3.6 1.2-4.5 2.7-.6 1-.9 2.2-.9 3.5h5.4V24H18z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <p className="lp-testimonial-card__body">{t.content}</p>
                <hr className="lp-testimonial-card__rule" />
                <div className="lp-testimonial-card__author">
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="lp-testimonials-footer">
            <a href="#resources" className="lp-testimonials-more">
              Read More
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer__grid">
            <div className="lp-footer__brand">
              <a href="/" className="lp-logo lp-logo--footer">
                <ShelfMerchLogo theme="light" height={32} className="lp-logo__img" />
              </a>
              <p className="lp-footer__tagline">
                Gifting, swag &amp; recognition. One platform.
              </p>
              <div className="lp-footer__social">
                <a href="#" aria-label="LinkedIn">
                  <Linkedin size={17} strokeWidth={2} />
                </a>
                <a href="#" aria-label="YouTube">
                  <Youtube size={17} strokeWidth={2} />
                </a>
                <a href="#" aria-label="Instagram">
                  <Instagram size={17} strokeWidth={2} />
                </a>
              </div>
              <div className="lp-footer__offerings">
                <p className="lp-footer__offerings-label">
                  <span>Our offerings</span>
                </p>
                <div className="lp-footer__offerings-list">
                  {FOOTER_OFFERINGS.map((item) => (
                    <a key={item.label} href="#products" className="lp-footer__offering">
                      <LpIcon icon={item.icon} size={14} strokeWidth={2} />
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title} className="lp-footer__col">
                <h4 className="lp-footer__col-title">{col.title}</h4>
                <ul className="lp-footer__links">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="lp-footer__bottom">
          <div className="lp-container lp-footer__bottom-inner">
            <span className="lp-footer__copy">© 2026 ShelfMerch. All rights reserved.</span>
            <div className="lp-footer__bottom-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Security</a>
              <a href="#">Need Help?</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

