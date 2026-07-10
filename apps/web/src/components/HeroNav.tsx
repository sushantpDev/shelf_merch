import { Button } from "@/components/ui/button";
import hoodieAsset from "../../assets/hoodie.png";
import toteAsset from "../../assets/tote.png";
import mugAsset from "../../assets/mug.png";
import capAsset from "../../assets/cap.png";
import bottleAsset from "../../assets/bottle.png";
import diaryAsset from "../../assets/diary.png";
import templateAsset from "../../assets/template.png";
import shelfmerch from "../../assets/shelfmerch.png";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Globe,
  Headphones,
  Menu,
  Truck,
} from "lucide-react";

export default function HeroNav() {
  return (
    <main className="hero-surface flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex h-full w-full max-w-[1520px] flex-col px-6 pb-4 pt-3 sm:px-8 lg:px-12">
        <nav className="flex items-center justify-between gap-6 py-2">
          <div className="flex items-center gap-3">
            <img src={shelfmerch} alt="Shelf Merch logo" className="h-8 w-8" loading="eager" />
            {/* <span className="text-[20px] font-semibold tracking-normal">Shelf Merch</span> */}
          </div>

          <div className="hidden items-center gap-8 text-[14px] font-medium lg:flex">
            <NavItem label="Products" />
            <NavItem label="Solutions" />
            <span>Pricing</span>
            <NavItem label="Resources" />
          </div>

          <div className="hidden items-center gap-4 lg:flex">
            <Button variant="ghost" className="h-9 px-3 text-[14px] font-medium text-foreground">
              Log in
            </Button>
            <Button className="h-9 rounded-lg px-5 text-[14px] font-semibold">Get started</Button>
          </div>

          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card lg:hidden"
          >
            <Menu className="size-5" />
          </button>
        </nav>

        <section className=" relative flex flex-1 flex-col items-center justify-center pt-2">
          <div className="mx-auto max-w-[820px] text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1.5 text-[12px] shadow-sm">
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-primary">
                NEW
              </span>
              <span>Spring collection now available</span>
              <ChevronRight className="size-3.5" />
            </div>

            <h1 className="mx-auto mt-4 max-w-[860px] text-[40px] font-semibold leading-[1] tracking-normal text-foreground sm:text-[52px] lg:text-[64px]">
              Limitless engagement.
              <br />
              Limitless engagement.
            </h1>

            <p className="mx-auto mt-4 max-w-[640px] text-[15px] leading-[1.45] text-muted-foreground sm:text-[17px]">
              Power your global recognition programs with premium swag,
              <br className="hidden md:block" />
              snack boxes, and gifts—all fulfilled locally in 170+ countries.
            </p>

            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button className="h-10 min-w-[180px] rounded-lg px-6 text-[14px] font-semibold shadow-sm">
                Get started for free
              </Button>
              <Button
                variant="outline"
                className="h-10 min-w-[140px] rounded-lg border-border bg-card px-6 text-[14px] font-semibold"
              >
                Book a demo
              </Button>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
              <Feature icon={CheckCircle2} label="100% risk-free" />
              <Dot />
              <Feature icon={Truck} label="No inventory" />
              <Dot />
              <Feature icon={Globe} label="Global fulfillment" />
              <Dot />
              <Feature icon={Headphones} label="Expert support" />
            </div>
          </div>

          <div className="mx-auto mt-10 w-3/4 max-w-[520px] px-2 sm:mt-12 lg:mt-14">
            <div className="overflow-hidden rounded-[20px] border border-[#e0ebe6] bg-white shadow-[0_24px_64px_-20px_rgba(0,77,61,0.18)]">
                <img src={templateAsset} alt="Shelf Merch editor interface for creating a branded hoodie design" className="block w-full object-contain" loading="eager" />
            </div>
          </div>

          <div className="pointer-events-none absolute left-[3%] top-[3rem] hidden xl:block">
            <DecorSprig />
          </div>
          <div className="pointer-events-none absolute left-[19%] top-[16rem] hidden xl:block">
            <DecorSquiggle />
          </div>
          <div className="pointer-events-none absolute right-[3.5%] top-[5rem] hidden xl:block rotate-[10deg]">
            <DecorWave />
          </div>
          <div className="pointer-events-none absolute right-[2.8%] bottom-[2rem] hidden xl:block">
            <DecorDots />
          </div>
          <div className="pointer-events-none absolute left-[1%] bottom-[3rem] hidden xl:block">
            <DecorDots />
          </div>

          <FloatingMerch
            src={hoodieAsset}
            alt="Green hoodie mockup"
            className="left-[5%] top-[5rem] hidden w-[190px] xl:block 2xl:w-[220px]"
          />
          <FloatingMerch
            src={toteAsset}
            alt="Canvas tote mockup"
            className="left-[2%] bottom-[10rem] hidden w-[150px] xl:block 2xl:w-[180px]"
          />
          <FloatingMerch
            src={mugAsset}
            alt="Branded mug mockup"
            className="left-[19%] bottom-[2rem] hidden w-[120px] xl:block 2xl:w-[140px]"
          />
          <FloatingMerch
            src={bottleAsset}
            alt="Water bottle mockup"
            className="right-[10%] top-[10rem] hidden w-[180px] xl:block 2xl:w-[150px]"
          />
          <FloatingMerch
            src={diaryAsset}
            alt="Notebook mockup"
            className="right-[2%] bottom-[14rem] hidden w-[140px] xl:block 2xl:w-[160px]"
          />
          <FloatingMerch
            src={capAsset}
            alt="Cap mockup"
            className="right-[10%] bottom-[0.5rem] hidden w-[140px] xl:block 2xl:w-[160px]"
          />
        </section>
      </div>
    </main>
  );
}

function NavItem({ label }: { label: string }) {
  return (
    <button type="button" className="inline-flex items-center gap-1.5 text-[15px] font-medium">
      <span>{label}</span>
      <ChevronDown className="size-4" />
    </button>
  );
}

function Feature({
  icon: Icon,
  label,
}: {
  icon: typeof CheckCircle2;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2.5 whitespace-nowrap">
      <Icon className="size-5 text-primary" strokeWidth={1.9} />
      <span>{label}</span>
    </div>
  );
}

function Dot() {
  return <span className="hidden text-muted-foreground/70 md:inline">•</span>;
}

function FloatingMerch({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  return <img src={src} alt={alt} className={`absolute merch-shadow ${className}`} loading="lazy" />;
}

function DecorSprig() {
  return (
    <svg width="58" height="42" viewBox="0 0 58 42" fill="none" className="text-primary/80">
      <path d="M13 29L2 19" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M26 14L21 1" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M41 22L55 16" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

function DecorSquiggle() {
  return (
    <svg width="70" height="90" viewBox="0 0 70 90" fill="none" className="text-primary/45">
      <path
        d="M48 7C25 16 15 35 21 47C27 59 46 58 50 70C53 79 46 86 34 87"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DecorWave() {
  return (
    <svg width="62" height="92" viewBox="0 0 62 92" fill="none" className="text-primary/45">
      <path
        d="M17 6C32 12 44 25 37 39C31 52 12 55 11 68C10 77 15 83 22 87"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DecorDots() {
  return (
    <div className="grid grid-cols-4 gap-3 text-primary/30">
      {Array.from({ length: 12 }).map((_, index) => (
        <span key={index} className="h-1.5 w-1.5 rounded-full bg-current" />
      ))}
    </div>
  );
}

const logoMark =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48' fill='none'%3E%3Cpath d='M24.2 4 7 13.8l17.2 9.7 17.1-9.7L24.2 4Z' fill='%230D7A5F'/%3E%3Cpath d='M11.6 23.8 24 30.8l12.3-7.1' stroke='%230D7A5F' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M11.6 33.7 24 40.8l12.3-7.1' stroke='%230D7A5F' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
