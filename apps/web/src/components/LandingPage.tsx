import { useState, type ReactNode } from "react";
import "./landing-page.css";
import { Link } from "react-router";
import type { LucideIcon } from "lucide-react";
import arrowAsset from "../../assets/arrow.avif";
import bottleAsset from "../../assets/bottle.png";
import capAsset from "../../assets/cap.png";
import diaryAsset from "../../assets/diary.png";
import hoodieAsset from "../../assets/hoodie.png";
import mugAsset from "../../assets/mug.png";
import templateAsset from "../../assets/template.png";
import toteAsset from "../../assets/tote.png";
import zigAsset from "../../assets/zig.avif";
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
  Play,
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
  Upload,
  X,
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

const HERO_FLOATS = [
  { src: hoodieAsset, alt: "Green hoodie mockup", className: "lp-hero__float--hoodie" },
  { src: toteAsset, alt: "Canvas tote mockup", className: "lp-hero__float--tote" },
  { src: mugAsset, alt: "Branded mug mockup", className: "lp-hero__float--mug" },
  { src: bottleAsset, alt: "Water bottle mockup", className: "lp-hero__float--bottle" },
  { src: diaryAsset, alt: "Notebook mockup", className: "lp-hero__float--diary" },
  { src: capAsset, alt: "Cap mockup", className: "lp-hero__float--cap" },
] as const;

const HERO_ACCENTS = [
  { src: zigAsset, className: "lp-hero__accent--zig-left" },
  // { src: zigAsset, className: "lp-hero__accent--zig-right" },
  // { src: arrowAsset, className: "lp-hero__accent--arrow-left" },
  { src: arrowAsset, className: "lp-hero__accent--arrow-right" },
] as const;

const INTRO_FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Monitor, title: "One dashboard", desc: "Shops, gifts, and swag unified" },
  { icon: Sparkles, title: "Smart automation", desc: "Milestones and peer recognition" },
  { icon: Globe, title: "Global reach", desc: "Fulfillment in 170+ countries" },
];

const INTRO_CHAPTERS = ["Overview", "Kits & Swag", "Gifting", "Analytics"] as const;

/* ─── offerings tabs (ShelfMerch) ─── */
const OFFERING_TABS = [
  {
    id: "shops",
    label: "Shops",
    icon: "/images/offering-icons/shops.svg",
    color: "#0D5C3F",
    bg: "#eef5f0",
    bgDark: "#14532d",
    title: "Do it all with your shop",
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
    id: "gifting",
    label: "Gifting",
    icon: "/images/offering-icons/gifting.svg",
    color: "#00C036",
    bg: "#ecfdf5",
    bgDark: "#047857",
    title: "All your gifting operations in one place",
    layout: "gifting" as const,
    cards: [
      { image: "/images/offerings/gifting/gift-boxes.png", title: "Gift Boxes", desc: "Customize everything from gifts to branding." },
      { image: "/images/offerings/gifting/give-a-budget.svg", title: "Give a Budget", desc: "Points, currency, or a number of gifts." },
      { image: "/images/offerings/gifting/spot-gifting.png", title: "Spot Gifting", desc: "Gift on a whim — there's always a reason to gift." },
      { image: "/images/offerings/gifting/automated-gifting.png", title: "Automated Gifting", desc: "Set and forget for any occasion." },
    ],
    features: ["Clients & Prospects", "Holidays & Celebrations", "Employee Appreciation", "Birthdays"],
  },
  {
    id: "anniversaries",
    label: "Service Anniversaries",
    icon: "/images/offering-icons/anniversaries.svg",
    color: "#1A6B52",
    bg: "#e8f2ed",
    bgDark: "#14532d",
    title: "Celebrate milestones across your team",
    layout: "anniversaries" as const,
    cards: [
      { image: "/images/offerings/anniversaries/spot-recurring.png", title: "Spot & Recurring", desc: "Give once or set ongoing recognition." },
      { image: "/images/offerings/anniversaries/feedback-reporting.svg", title: "Feedback & Reporting", desc: "Guardrails, analytics, and insights." },
      { image: "/images/offerings/anniversaries/integrations.png", title: "Integrations", desc: "HRIS, CRM, Slack, Teams, and more." },
    ],
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

const SHOP_HERO_IMAGE = "/images/shops/shop-preview-clean.png";

/* ─── data ─── */
const TEAMS = [
  {
    id: "hr",
    label: "Human Resources",
    icon: Users,
    src: "/assets/teams/human_resources.png",
    title: "Empower Your Employees",
    desc: "Optimize HR processes, recognize employees, and nurture the employee experience with ShelfMerch.",
    benefits: [
      "Onboard employees with an onboarding shop or swag kits.",
      "Automate service awards and milestone celebrations.",
      "Build culture with peer-to-peer recognition programs.",
    ],
  },
  {
    id: "marketing",
    label: "Marketing & Branding",
    icon: Megaphone,
    src: "/assets/teams/marketing_branding.png",
    title: "Amplify Your Brand",
    desc: "Deliver branded experiences that leave lasting impressions on customers and partners.",
    benefits: [
      "Launch branded company stores in minutes.",
      "Send curated gift campaigns at scale.",
      "Track engagement and ROI across programs.",
    ],
  },
  {
    id: "leaders",
    label: "Team Leaders",
    icon: Target,
    src: "/assets/teams/team_leaders.png",
    title: "Motivate Your Teams",
    desc: "Give managers the tools to recognize wins and keep teams engaged every day.",
    benefits: [
      "Distribute kudos budgets to team leads.",
      "Celebrate wins with instant rewards.",
      "Run team-specific gifting programs.",
    ],
  },
  {
    id: "sales",
    label: "Sales",
    icon: Briefcase,
    src: "/assets/teams/sales.png",
    title: "Close Deals Faster",
    desc: "Prospect, incentivize, and reward with premium gifts that open doors.",
    benefits: [
      "Send prospecting gifts globally.",
      "Run sales incentive programs effortlessly.",
      "Track redemption and engagement metrics.",
    ],
  },
  {
    id: "ops",
    label: "Operations",
    icon: Settings,
    src: "/assets/teams/operations.png",
    title: "Streamline Operations",
    desc: "Consolidate vendors, automate fulfillment, and reduce operational overhead.",
    benefits: [
      "One platform for all gifting and swag.",
      "Automated global fulfillment and tracking.",
      "Centralized billing and reporting.",
    ],
  },
  {
    id: "events",
    label: "Event Managers",
    icon: Tent,
    src: "/assets/teams/event_managers.png",
    title: "Elevate Every Event",
    desc: "From welcome kits to booth swag, deliver memorable event experiences.",
    benefits: [
      "Ship event kits to any location worldwide.",
      "Custom branding on every item.",
      "Real-time order tracking and support.",
    ],
  },
] as const;

const CATEGORIES = [
  { title: "Food & Beverages", img: "/images/landing/categories/food-beverages.png", fullCard: true },
  { title: "Luxury", img: "/images/landing/categories/luxury.png", fullCard: true },
  { title: "Wellness", img: "/images/landing/categories/wellness.png", fullCard: true },
  { title: "Gift Cards", img: "/images/landing/categories/gift-cards.png", fullCard: true },
  {
    title: "Work & Essentials",
    img: "/images/landing/categories/work-essentials.png",
    fullCard: true,
  },
  { title: "Apparel & Wearables", img: "/images/landing/categories/apparel-wearables.png", fullCard: true, bleed: true },
  {
    title: "Life & Hobbies",
    img: "/images/landing/categories/life-hobbies.png",
    fullCard: true,
  },
  {
    title: "Experiences",
    img: "/images/landing/categories/experiences.png",
    fullCard: true,
  },
] as const;

const USE_CASES: { label: string; icon: LucideIcon; bg: string; color: string }[] = [
  { label: "Employee Appreciation", icon: Star, bg: "#D1FAE5", color: "#059669" },
  { label: "Rewards & Recognition", icon: Award, bg: "#FEF3C7", color: "#D97706" },
  { label: "Swag Distribution", icon: Package, bg: "#EDE9FE", color: "#7C3AED" },
  { label: "Client Gifting", icon: Gift, bg: "#D1FAE5", color: "#059669" },
  { label: "Sales Incentives", icon: Target, bg: "#CCFBF1", color: "#0D9488" },
  { label: "Employee Birthday Gifts", icon: Cake, bg: "#CCFBF1", color: "#0D9488" },
  { label: "Snack Boxes", icon: Popcorn, bg: "#FFEDD5", color: "#EA580C" },
  { label: "Prospecting & Outreach", icon: Search, bg: "#DBEAFE", color: "#2563EB" },
  { label: "Onboarding Kits", icon: IdCard, bg: "#DBEAFE", color: "#2563EB" },
  { label: "Work Anniversaries", icon: Calendar, bg: "#FCE7F3", color: "#DB2777" },
  { label: "Gift Cards", icon: CreditCard, bg: "#CCFBF1", color: "#0D9488" },
  { label: "Celebration Kits", icon: PartyPopper, bg: "#FCE7F3", color: "#DB2777" },
  { label: "Remote Employee Kits", icon: Laptop, bg: "#EDE9FE", color: "#7C3AED" },
  { label: "Swag Store Redemption", icon: ShoppingBag, bg: "#D1FAE5", color: "#059669" },
  { label: "Channel Partner Rewards", icon: Handshake, bg: "#DBEAFE", color: "#2563EB" },
  { label: "Corporate Events", icon: Tent, bg: "#FFEDD5", color: "#EA580C" },
  { label: "Marketing Campaigns", icon: Megaphone, bg: "#FCE7F3", color: "#DB2777" },
  { label: "Company Store", icon: Store, bg: "#DBEAFE", color: "#2563EB" },
  { label: "Wellness Programs", icon: Heart, bg: "#FCE7F3", color: "#DB2777" },
  { label: "New Hire Welcome", icon: Hand, bg: "#CCFBF1", color: "#0D9488" },
  { label: "Customer Loyalty", icon: Heart, bg: "#FFEDD5", color: "#EA580C" },
  { label: "Boosting Attendance", icon: TrendingUp, bg: "#EDE9FE", color: "#7C3AED" },
  { label: "Boosting Response Rates", icon: MessageCircle, bg: "#FEF3C7", color: "#D97706" },
  { label: "Recognizing DEI Events", icon: HeartHandshake, bg: "#EDE9FE", color: "#7C3AED" },
];

const TESTIMONIALS = [
  {content: "ShelfMerch has completely streamlined our branded merchandise process. The quality is top-notch, the platform is easy to use, and our team loves the variety of options!", src: "/assets/testemonies/messi.webp", name: "messi"},
  {content: "From onboarding kits to employee appreciation gifts, ShelfMerch helps us deliver meaningful swag that represents our brand perfectly. Our go-to platform!", src: "/assets/testemonies/stephanhawking.webp", name: "stephanhawking"},
  {content: "The ShelfMerch team is amazing! ShelfMerch helps us deliver meaningfu Fast  and Fast to turnaround, great support, and products our employees actually use and love.", src: "/assets/testemonies/kim_jong_un.webp", name: "kimjongun"},
] as const;

const TRUSTED_LOGOS = [
  { name: "Google", src: "/images/logos/google-wordmark.svg", width: 92, height: 28 },
  { name: "Pinterest", src: "/images/logos/pinterest-wordmark.png", width: 110, height: 28 },
  { name: "Spotify", src: "/images/logos/spotify-wordmark.svg", width: 100, height: 28 },
  { name: "Airbnb", src: "/images/logos/airbnb-wordmark.svg", width: 92, height: 28 },
  { name: "Slack", src: "/images/logos/slack-wordmark.svg", width: 88, height: 28 },
  { name: "HubSpot", src: "/images/logos/hubspot-wordmark.svg", width: 96, height: 28 },
] as const;

const INTEGRATIONS: { icon: LucideIcon; label: string }[] = [
  { icon: Wallet, label: "Payroll" },
  { icon: Plane, label: "Travel" },
  { icon: Gift, label: "Gifting" },
  { icon: Rocket, label: "Automation" },
  { icon: Package, label: "Fulfillment" },
  { icon: MessageCircle, label: "Slack" },
  { icon: Users, label: "HRIS" },
  { icon: Eye, label: "Analytics" },
];

const KUDOS_FEED = [
  { initials: "PS", name: "Priya S.", action: "sent kudos", message: "Great work on the launch!", points: 15, tone: "#C45C6A" },
  { initials: "MK", name: "Marcus K.", action: "shout-out", message: "Thanks for going the extra mile.", points: 10, tone: "#A84855" },
  { initials: "AL", name: "Alex L.", action: "recognized", message: "Crushed the client demo today.", points: 20, tone: "#B85A68" },
] as const;

/* ─── component ─── */
export default function LandingPage() {
  const [offering, setOffering] = useState<OfferingId>("shops");
  const [team, setTeam] = useState<(typeof TEAMS)[number]["id"]>("hr");
  const [isDragActive, setIsDragActive] = useState(false);
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const activeTeam = TEAMS.find((t) => t.id === team)!;
  const activeOffering = OFFERING_TABS.find((t) => t.id === offering)!;

  return (
    <div className="lp">
      {/* ── NAV ── */}
      <header className="lp-nav lp-nav--merch">
        <div className="lp-container lp-nav__inner lp-nav__inner--merch">
          <a href="/" className="lp-logo">
            <img
              src="/assets/rockefeller.png"
              alt="Shelf Merch"
              width={178}
              height={30}
              className="lp-logo__img"
            />
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
            <Link to="/login" className="lp-btn-ghost lp-btn-ghost--merch">
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
      <div className="lp-hero-zone lp-hero-zone--merch">
        <div className="lp-hero__floats" aria-hidden="true">
          {HERO_ACCENTS.map((accent) => (
            <img
              key={accent.className}
              src={accent.src}
              alt=""
              className={`lp-hero__accent ${accent.className}`}
              loading="eager"
            />
          ))}
          {HERO_FLOATS.map((product) => (
            <img
              key={product.alt}
              src={product.src}
              alt={product.alt}
              className={`lp-hero__float ${product.className}`}
              loading="eager"
            />
          ))}
          <LpHeroDecorSprig className="lp-hero__decor lp-hero__decor--sprig" />
          <LpHeroDecorSquiggle className="lp-hero__decor lp-hero__decor--squiggle" />
          <LpHeroDecorWave className="lp-hero__decor lp-hero__decor--wave" />
          <LpHeroDecorDots className="lp-hero__decor lp-hero__decor--dots-r" />
          <LpHeroDecorDots className="lp-hero__decor lp-hero__decor--dots-l" />
        </div>

        <section className="lp-hero lp-hero--merch">
          <div className="lp-hero--merch__inner">
            <div className="lp-hero__content lp-hero__content--merch">
              {/* <a href="#products" className="lp-hero__announce">
                <strong>NEW</strong>
                <span>Spring collection now available</span>
                <ChevronRight className="lp-hero__announce-icon" aria-hidden />
              </a> */}

              <h1 className="lp-hero__headline">
                Limitless engagement.
                <br />
                One platform.
              </h1>

              <p className="lp-hero__lede">
                Power your global recognition programs with premium swag,
                <br className="lp-hero__lede-br" />
                snack boxes, and gifts—all fulfilled locally in 170+ countries.
              </p>

              <div className="lp-hero__ctas lp-hero__ctas--merch">
                <Link to="/signup" className="lp-btn-primary lp-btn-pill">
                  Get started for free
                </Link>
                <a href="#demo" className="lp-btn-outline-green">
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

            <div
              className={`lp-hero__mockup ${isDragActive ? "is-drag-active" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragActive(true);
              }}
              onDragLeave={() => {
                setIsDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragActive(false);
                const files = e.dataTransfer.files;
                if (files && files[0] && files[0].type.startsWith("image/")) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    if (ev.target?.result) {
                      setCustomLogo(ev.target.result as string);
                    }
                  };
                  reader.readAsDataURL(files[0]);
                }
              }}
            >
              
              <img
                src={arrowAsset}
                alt=""
                className="lp-hero__mockup-accent lp-hero__mockup-accent--arrow"
                aria-hidden="true"
                loading="eager"
              />
              <div className="lp-hero__mockup-frame">
                <img
                  src={templateAsset}
                  alt="Shelf Merch editor interface for creating a branded hoodie design"
                  loading="eager"
                />

                {/* Dropped custom logo overlay */}
                {customLogo && (
                  <div className="lp-hero__mockup-logo-container">
                    <img
                      src={customLogo}
                      alt="Custom branding logo"
                      className="lp-hero__mockup-logo"
                    />
                  </div>
                )}

                {/* Reset button floating inside mockup frame */}
                {customLogo && (
                  <button
                    type="button"
                    className="lp-hero__mockup-logo-reset"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCustomLogo(null);
                    }}
                    title="Reset Custom Design"
                  >
                    <X size={12} />
                    <span>Reset Design</span>
                  </button>
                )}

                {/* Drag-over overlay */}
                {isDragActive && (
                  <div className="lp-hero__mockup-dropzone">
                    <div className="lp-hero__mockup-dropzone-box">
                      <Upload className="lp-hero__mockup-dropzone-icon" />
                      <p className="lp-hero__mockup-dropzone-title">Drop your logo</p>
                      <p className="lp-hero__mockup-dropzone-desc">to customize the hoodie</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── OFFERINGS TABS ── */}
      <section className="lp-section lp-offerings" id="products">
        <div className="lp-container" style={{position: "relative", top: "60px"}}>
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

            {activeOffering.layout === "shop" && (
              <div className="lp-offerings-shop">
                <div className="lp-shop-hero">
                  <img
                    src={SHOP_HERO_IMAGE}
                    alt="Branded company shop with customizable swag, points redemption, and thousands of catalog options"
                    width={2149}
                    height={1031}
                    className="lp-shop-hero__img"
                    loading="eager"
                    decoding="async"
                  />
                </div>

                <aside className="lp-offerings-perfect lp-offerings-perfect--shop">
                  <h4>Perfect for:</h4>
                  <ul>
                    {activeOffering.perfectFor?.map((item) => (
                      <li key={item}>
                        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <circle cx="8" cy="8" r="8" fill="#ede9fe" />
                          <path d="M5 8.2 7 10.2 11 6.2" stroke="#0D5C3F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link to="/app/shops" className="lp-offerings-learn">Learn More →</Link>
                </aside>
              </div>
            )}

            {(activeOffering.layout === "gifting" || activeOffering.layout === "anniversaries") && activeOffering.cards && (
              <div className={`lp-offerings-feature-cards lp-offerings-feature-cards--${activeOffering.layout}`}>
                <div className="lp-offerings-feature-cards__grid">
                  {activeOffering.cards.map((card) => (
                    <article key={card.title} className="lp-offerings-feature-cards__card">
                      <div className="lp-offerings-feature-cards__visual">
                        {"image" in card && (
                          <img
                            src={card.image}
                            alt=""
                            width={284}
                            height={206}
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                      </div>
                      <h4>{card.title}</h4>
                      {"desc" in card && card.desc && <p>{card.desc}</p>}
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
            <ul className={`lp-offerings-footer${activeOffering.layout === "gifting" ? " lp-offerings-footer--gifting" : ""}${activeOffering.layout === "anniversaries" ? " lp-offerings-footer--anniversaries" : ""}${activeOffering.layout === "kudos" ? " lp-offerings-footer--kudos" : ""}`}>
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

      {/* ── VIDEO INTRO ── */}
      <section className="lp-section lp-intro" id="demo">
        <div className="lp-container">
          <LpSectionHeader
            badge="Platform Tour"
            title={<>See ShelfMerch <span className="c-gold">in action</span></>}
            sub="Watch how teams worldwide engage employees, delight customers, and consolidate gifting, swag, and recognition in one platform."
          />
          <div className="lp-shell lp-intro__shell">
            <div className="lp-intro__grid">
              <div className="lp-intro__copy">
                <p className="lp-intro__eyebrow">
                  <Play size={12} fill="currentColor" strokeWidth={0} aria-hidden />
                  2-minute product walkthrough
                </p>
                <h3>Take your ShelfMerch experience further</h3>
                <p className="lp-intro__lede">
                  From onboarding kits to global gifting campaigns—manage every recognition moment
                  without juggling vendors.
                </p>
                <ul className="lp-intro__features">
                  {INTRO_FEATURES.map((feature) => (
                    <li key={feature.title} className="lp-intro__feature">
                      <span className="lp-intro__feature-icon" aria-hidden>
                        <LpIcon icon={feature.icon} size={18} strokeWidth={2.25} />
                      </span>
                      <span className="lp-intro__feature-text">
                        <strong>{feature.title}</strong>
                        <span>{feature.desc}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="lp-intro__ctas">
                  <Link to="/signup" className="lp-btn-primary lp-btn-primary-sm lp-btn-pill">
                    Get started free
                  </Link>
                  <a href="#intro-video" className="lp-intro__play-link">
                    <span className="lp-intro__play-link-icon" aria-hidden>
                      <Play size={14} fill="currentColor" strokeWidth={0} />
                    </span>
                    Watch overview
                  </a>
                </div>
              </div>
              <div className="lp-intro__media" id="intro-video">
                <div className="lp-video-mock">
                  <div className="lp-video-mock__bar" aria-hidden>
                    <span className="lp-video-mock__dot lp-video-mock__dot--close" />
                    <span className="lp-video-mock__dot lp-video-mock__dot--min" />
                    <span className="lp-video-mock__dot lp-video-mock__dot--max" />
                    <span className="lp-video-mock__title">ShelfMerch — Platform Overview</span>
                  </div>
                  <button
                    type="button"
                    className="lp-video-mock__screen"
                    aria-label="Play platform overview video (2 minutes 45 seconds)"
                  >
                    <img
                      className="lp-video-mock__poster"
                      src={templateAsset}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="lp-video-mock__overlay" aria-hidden>
                      <span className="lp-video-mock__play">
                        <Play size={26} fill="currentColor" strokeWidth={0} />
                      </span>
                      <span className="lp-video-mock__label">Platform Overview</span>
                    </span>
                    <span className="lp-video-mock__duration">2:45</span>
                    <span className="lp-video-mock__progress" aria-hidden>
                      <span className="lp-video-mock__progress-fill" />
                    </span>
                  </button>
                  <div className="lp-video-mock__chapters" role="list" aria-label="Video chapters">
                    {INTRO_CHAPTERS.map((chapter, index) => (
                      <span
                        key={chapter}
                        role="listitem"
                        className={`lp-video-mock__chapter${index === 0 ? " is-active" : ""}`}
                      >
                        {chapter}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="lp-intro__caption">
                  <Users size={14} strokeWidth={2.25} aria-hidden />
                  Trusted by HR, Marketing &amp; Ops teams worldwide
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF (logos + quote) ── */}
      <section className="lp-section lp-social" style={{height: "50vh"}}>
        <div className="lp-container lp-social__layout">
          <div className="lp-social__copy">
            <p className="lp-social__label">For every possible occasion</p>
            <h2 className="lp-social__title">
              Loved by teams <span>everywhere</span>
            </h2>
          </div>
          <div className="lp-social__logos" aria-label="Companies using ShelfMerch">
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
        <div className="lp-container" style={{position: "relative", top: "20px"}}>
          <figure className="lp-social__quote lp-shell">
            <span className="lp-social__mark" aria-hidden="true">"</span>
            <blockquote>
              We saved vendors a ton of money and took our engagement to a whole new level.
            </blockquote>
            <figcaption className="lp-social__author">
              <span className="lp-social__avatar">SM</span>
              <span>
                <strong>Sarah Mitchell</strong>
                <span>Head of People, TechCorp</span>
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="lp-section lp-categories-section" id="solutions">
        <div className="lp-container">
          <LpSectionHeader
            badge="For Everyone"
            title={<>Something for <span className="c-gold">Everyone</span></>}
            sub="Discover unlimited possibilities with our catalog. From snacks to swag, we've got it all."
          />
          <div className="lp-categories">
            {CATEGORIES.map((c) =>
              "fullCard" in c && c.fullCard ? (
                <Link
                  key={c.title}
                  to="/app/catalog"
                  className={`lp-cat-card lp-cat-card--full${"bleed" in c && c.bleed ? " lp-cat-card--bleed" : ""}`}
                >
                  <img src={c.img} alt={c.title} width={600} height={600} loading="lazy" decoding="async" />
                </Link>
              ) : (
                <Link
                  key={c.title}
                  to="/app/catalog"
                  className="lp-cat-card lp-cat-card--tile"
                  style={{ background: "bg" in c ? (c.bg as string) : undefined }}
                >
                  <h3>{c.title}</h3>
                  <div className="lp-cat-card__media">
                    <img src={c.img} alt={c.title} width={600} height={600} loading="lazy" decoding="async" />
                  </div>
                </Link>
              ),
            )}
          </div>
          <div className="lp-categories__cta">
            <Link to="/app/catalog" className="lp-btn-gold lp-btn-gold--sm">View Catalog →</Link>
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ── */}
      {/* <section className="lp-section lp-integrations">
        <div className="lp-container">
          <LpSectionHeader
            badge="Integrations"
            title={
              <>
                Consolidate your <span className="c-gold">gifting, swag,</span> and{" "}
                <span className="c-gold">recognition</span> vendors
              </>
            }
            sub="Save big on budget and headaches with one connected platform."
          />
          <div className="lp-shell lp-integrations__shell">
            <div className="lp-integration-graphic">
              <svg className="lp-path" viewBox="0 0 900 200" preserveAspectRatio="xMidYMid meet">
                <path d="M 20 160 Q 250 40, 500 100 T 820 80" fill="none" stroke="var(--lp-green-mid)" strokeWidth="2" strokeDasharray="8 6" />
                <circle cx="20" cy="160" r="6" fill="var(--lp-green)" />
                <circle cx="820" cy="80" r="6" fill="var(--lp-gold)" />
              </svg>
              <div className="lp-integration-icons">
                {INTEGRATIONS.map((item, i) => (
                  <div key={item.label} className="lp-int-icon" title={item.label} style={{ left: `${8 + i * 11.5}%` }}>
                    <LpIcon icon={item.icon} size={18} strokeWidth={2} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* ── TEAMS TABS ── */}
      <section className="lp-section lp-teams-section">
        <div className="lp-container">
          <LpSectionHeader
            badge="Built for Teams"
            title={<>One solution for <span className="c-gold">all your teams</span></>}
            sub="HR, sales, marketing, and ops—every department gets the tools they need."
          />
          <div className="lp-shell lp-teams-card">
            <nav className="lp-teams-nav">
              {TEAMS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`lp-teams-nav__item${team === t.id ? " active" : ""}`}
                  onClick={() => setTeam(t.id)}
                >
                  <span className="lp-teams-nav__icon"><LpIcon icon={t.icon} size={15} strokeWidth={2} /></span>
                  {t.label}
                </button>
              ))}
            </nav>
            <div className="lp-teams-feature">
              <img
                src={activeTeam.src}
                alt={activeTeam.title}
                width={600}
                height={600}
                loading="lazy"
                decoding="async"
              />
            </div>
            <ul className="lp-teams-benefits">
              {activeTeam.benefits.map((b) => (
                <li key={b}>
                  <span className="check"><Check size={12} strokeWidth={3} /></span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section className="lp-section lp-usecases">
        <div className="lp-container">
          <LpSectionHeader
            badge="Unlimited Use Cases"
            title={<>ShelfMerch for <span className="c-gold">Every Occasion</span></>}
            sub="From everyday appreciation to big milestones—engage, reward, and celebrate anytime, anywhere."
          />
          <div className="lp-usecases-grid">
            {USE_CASES.map((uc) => (
              <div key={uc.label} className="lp-usecase-card">
                <span className="lp-usecase-card__icon" style={{ background: uc.bg, color: uc.color }}>
                  <LpIcon icon={uc.icon} size={18} strokeWidth={2} />
                </span>
                <span>{uc.label}</span>
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
          <LpSectionHeader
            badge="Customer Stories"
            title={<>What keeps <span className="c-gold">'em coming</span></>}
            sub="Hear from teams who consolidated gifting, swag, and recognition on ShelfMerch."
          />

          <div className="lp-testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="lp-testimonial-card lp-shell">
                <div className="lp-testimonial-card__quote">"</div>
                <p>{t.content}</p>
                <hr />
                <div className="lp-testimonial-card__author">
                  <div className="lp-testimonial-card__avatar"><img src={t.src} alt={t.name} width={46} height={46} loading="lazy" decoding="async" className="lp-testimonial-card__avatar img" /></div>
                </div>
              </div>
            ))}
          </div>
          <div className="lp-center">
            <button type="button" className="lp-btn-gold lp-btn-gold--sm lp-btn-pill">Read More →</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer__grid">
          <div>
            <a href="/" className="lp-logo lp-logo--footer">
              <img
                src="/images/logo/shelfmerch-logo-light.svg"
                alt="ShelfMerch"
                width={168}
                height={28}
                className="lp-logo__img"
              />
            </a>
            <div className="lp-footer__social">
              <a href="#" aria-label="LinkedIn"><Linkedin size={18} strokeWidth={2} /></a>
              <a href="#" aria-label="Instagram"><Instagram size={18} strokeWidth={2} /></a>
            </div>
          </div>
          {[
            { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
            { title: "Products", links: ["Shops", "Gifting", "Swag", "Snacks", "Gift Cards"] },
            { title: "Solutions", links: ["HR", "Sales", "Marketing", "Events", "Operations"] },
            { title: "Resources", links: ["Blog", "Help Center", "API Docs", "Case Studies"] },
          ].map((col) => (
            <div key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l}><a href="#">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="lp-footer__bottom">
          <div className="lp-container">
            <span>© 2026 ShelfMerch. All rights reserved.</span>
            <span><a href="#">Privacy Policy</a> · <a href="#">Terms of Service</a></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LpHeroDecorSprig({ className }: { className?: string }) {
  return (
    <svg className={className} width="58" height="42" viewBox="0 0 58 42" fill="none" aria-hidden>
      <path d="M13 29L2 19" stroke="#004D3D" strokeWidth="3.5" strokeLinecap="round" opacity="0.8" />
      <path d="M26 14L21 1" stroke="#004D3D" strokeWidth="3.5" strokeLinecap="round" opacity="0.8" />
      <path d="M41 22L55 16" stroke="#004D3D" strokeWidth="3.5" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

function LpHeroDecorSquiggle({ className }: { className?: string }) {
  return (
    <svg className={className} width="70" height="90" viewBox="0 0 70 90" fill="none" aria-hidden>
      <path
        d="M48 7C25 16 15 35 21 47C27 59 46 58 50 70C53 79 46 86 34 87"
        stroke="#004D3D"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

function LpHeroDecorWave({ className }: { className?: string }) {
  return (
    <svg className={className} width="62" height="92" viewBox="0 0 62 92" fill="none" aria-hidden>
      <path
        d="M17 6C32 12 44 25 37 39C31 52 12 55 11 68C10 77 15 83 22 87"
        stroke="#004D3D"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

function LpHeroDecorDots({ className }: { className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: 12 }).map((_, index) => (
        <span key={index} className="lp-hero__decor-dot" />
      ))}
    </div>
  );
}
