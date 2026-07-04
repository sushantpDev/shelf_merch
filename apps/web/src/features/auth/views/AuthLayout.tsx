import { Link } from "react-router";
import type { LucideIcon } from "lucide-react";
import {
  Layers,
  Sparkles,
  Tag,
  Wallet,
  Pencil,
  Package,
  Users,
  ShieldCheck,
  Rocket,
  Shield,
  Headphones,
} from "lucide-react";
import heroImage from "../../../../assets/auth.png";

const localTrustLogoModules = import.meta.glob<{ default: string }>(
  "../../../../assets/{spotify,notion,webflow,ramp,deel}.{png,svg,jpg,jpeg,webp}",
  { eager: true },
);

const features = [
  { icon: Tag, label: "Branded stores" },
  { icon: Wallet, label: "Points wallets" },
  { icon: Pencil, label: "Swag designer" },
  { icon: Package, label: "Kits at scale" },
  { icon: Users, label: "HRIS sync" },
];

const trustLogos = [
  { name: "Spotify", slug: "spotify", color: "1ED760" },
  { name: "Notion", slug: "notion", color: "000000" },
  { name: "Webflow", slug: "webflow", color: "146EF5" },
  { name: "Ramp", slug: "ramp", color: "0A1F1C" },
  { name: "Deel", slug: "deel", color: "1453FF" },
];

const perks = [
  { icon: Rocket, title: "Launch in minutes", desc: "Go from idea to live store in minutes." },
  { icon: Shield, title: "Secure & reliable", desc: "Enterprise-grade security you can count on." },
  { icon: Headphones, title: "We're here to help", desc: "Real humans. Real fast support." },
];

function resolveTrustLogoSrc(slug: string, color: string): string {
  for (const ext of ["png", "svg", "jpg", "jpeg", "webp"] as const) {
    const assetPath = `../../../../assets/${slug}.${ext}`;
    const module = localTrustLogoModules[assetPath];
    if (module) return module.default;
  }
  return `https://cdn.simpleicons.org/${slug}/${color}`;
}

type AuthLayoutProps = {
  children: React.ReactNode;
  headerHint: string;
  headerActionLabel: string;
  headerActionTo: "/login" | "/signup";
  cardIcon: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle: string;
};

export function AuthLayout({
  children,
  headerHint,
  headerActionLabel,
  headerActionTo,
  cardIcon: CardIcon,
  eyebrow,
  title,
  subtitle,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f7faf8] text-[#0f1a14]">
      <header className="flex items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0f4d2e] text-white">
            <Layers className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-[#0f4d2e]">SwagStore</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-[#0f1a14] sm:inline">{headerHint}</span>
          <Link
            to={headerActionTo}
            className="rounded-lg border border-[#0f4d2e] px-4 py-2 text-sm font-medium text-[#0f4d2e] transition hover:bg-[#0f4d2e] hover:text-white"
          >
            {headerActionLabel}
          </Link>
        </div>
      </header>

      <main className="grid grid-cols-1 gap-8 px-6 pb-10 md:px-12 lg:grid-cols-2 lg:gap-12">
        <section className="flex flex-col">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#dff0e4] px-4 py-2 text-sm text-[#0f4d2e]">
            <Sparkles className="h-4 w-4" />
            Everything your team needs. One smart workspace.
          </div>

          <h1 className="mt-8 text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            Corporate swag &<br />
            gifting, <span className="text-[#0f4d2e]">on autopilot.</span>
          </h1>

          <p className="mt-6 max-w-md text-lg text-[#3a463f]">
            Design, manage and deliver branded merchandise that your team will love.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 rounded-xl border border-[#e5ede8] bg-white/80 px-4 py-3 text-sm font-medium backdrop-blur-sm"
              >
                <f.icon className="h-4 w-4 text-[#0f4d2e]" />
                {f.label}
              </div>
            ))}
          </div>

          <div className="relative mt-4 flex-1 overflow-hidden rounded-3xl">
            <img
              src={heroImage}
              alt="Branded swag apparel and accessories"
              className="w-full max-w-3xl"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[#e5ede8] pt-6">
            <div className="flex items-center gap-2 text-sm text-[#3a463f]">
              <ShieldCheck className="h-4 w-4 text-[#0f4d2e]" />
              Trusted by leading teams worldwide
            </div>
            {trustLogos.map((l) => (
              <img
                key={l.slug}
                src={resolveTrustLogoSrc(l.slug, l.color)}
                alt={l.name}
                className="h-5 w-auto opacity-70"
              />
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf2ec]">
            <CardIcon className="h-5 w-5 text-[#0f4d2e]" />
          </div>

          <p className="mt-6 text-sm font-medium text-[#0f4d2e]">{eyebrow}</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm text-[#6b7a70]">{subtitle}</p>

          {children}

          <div className="mt-8 grid grid-cols-3 gap-3 rounded-2xl bg-[#f3f7f5] p-5">
            {perks.map((p) => (
              <div key={p.title} className="text-center">
                <p.icon className="mx-auto h-5 w-5 text-[#0f4d2e]" />
                <p className="mt-2 text-xs font-semibold">{p.title}</p>
                <p className="mt-1 text-[11px] leading-tight text-[#6b7a70]">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px flex-1 bg-[#e5ede8]" />
      <span className="text-xs font-medium text-[#6b7a70]">OR</span>
      <div className="h-px flex-1 bg-[#e5ede8]" />
    </div>
  );
}

export function GoogleSignInButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#e5ede8] bg-white py-3 text-sm font-medium transition hover:bg-[#f7faf8]"
    >
      <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#FFC107"
          d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
        />
        <path
          fill="#FF3D00"
          d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C40.9 35.3 44 30 44 24c0-1.3-.1-2.3-.4-3.5z"
        />
      </svg>
      Continue with Google
    </button>
  );
}

const inputClassName =
  "w-full rounded-lg border border-[#e5ede8] bg-[#fafcfb] py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#0f4d2e]";

const inputWithToggleClassName =
  "w-full rounded-lg border border-[#e5ede8] bg-[#fafcfb] py-3 pl-10 pr-10 text-sm outline-none transition focus:border-[#0f4d2e]";

export function AuthField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#0f1a14]">{label}</label>
      <div className="relative mt-2">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7a70]" />
        {children}
      </div>
    </div>
  );
}

export { inputClassName, inputWithToggleClassName };
