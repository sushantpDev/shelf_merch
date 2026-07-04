// import { Link } from "react-router";
// import {
//   ChevronDown,
//   ChevronRight,
//   CircleCheck,
//   Globe,
//   Headphones,
//   Layers3,
//   Menu,
//   Truck,
// } from "lucide-react";
// import bottleAsset from "../../assets/bottle.png";
// import capAsset from "../../assets/cap.png";
// import diaryAsset from "../../assets/diary.png";
// import hoodieAsset from "../../assets/hoodie.png";
// import mugAsset from "../../assets/mug.png";
// import templateAsset from "../../assets/template.png";
// import toteAsset from "../../assets/tote.png";
// import { Button } from "@/components/ui/button";

// const GREEN = "#004D3D";
// const CREAM = "#f9f8f3";
// const MUTED = "#5a6b64";

// const navItems = [
//   { label: "Products", hasChevron: true, href: "#products" },
//   { label: "Solutions", hasChevron: true, href: "#solutions" },
//   { label: "Pricing", hasChevron: false, href: "#pricing" },
//   { label: "Resources", hasChevron: true, href: "#resources" },
// ] as const;

// const trustItems = [
//   { label: "100% risk-free", icon: CircleCheck },
//   { label: "No inventory", icon: Truck },
//   { label: "Global fulfillment", icon: Globe },
//   { label: "Expert support", icon: Headphones },
// ] as const;

// const floatingProducts = [
//   {
//     src: hoodieAsset,
//     alt: "Shelf Merch branded hoodie",
//     className:
//       "left-[1%] top-[10%] w-[min(13vw,200px)] -rotate-[3deg] xl:left-[3%] xl:top-[11%]",
//   },
//   {
//     src: toteAsset,
//     alt: "Shelf Merch branded tote bag",
//     className:
//       "left-[2%] top-[52%] w-[min(9vw,138px)] -rotate-[6deg] xl:left-[4%] xl:top-[51%]",
//   },
//   {
//     src: mugAsset,
//     alt: "Shelf Merch branded mug",
//     className:
//       "left-[3%] top-[74%] w-[min(8vw,118px)] -rotate-[6deg] xl:left-[5%] xl:top-[73%]",
//   },
//   {
//     src: bottleAsset,
//     alt: "Shelf Merch branded bottle",
//     className:
//       "right-[2%] top-[11%] w-[min(6vw,92px)] rotate-[10deg] xl:right-[4%] xl:top-[12%]",
//   },
//   {
//     src: diaryAsset,
//     alt: "Shelf Merch branded notebook",
//     className:
//       "right-[1.5%] top-[50%] w-[min(9vw,132px)] rotate-[7deg] xl:right-[3.5%] xl:top-[49%]",
//   },
//   {
//     src: capAsset,
//     alt: "Shelf Merch branded cap",
//     className:
//       "right-[2%] top-[72%] w-[min(11vw,168px)] rotate-[6deg] xl:right-[4%] xl:top-[71%]",
//   },
// ] as const;

// function DecorativeSquiggle({ className }: { className?: string }) {
//   return (
//     <svg
//       className={className}
//       width="48"
//       height="32"
//       viewBox="0 0 48 32"
//       fill="none"
//       aria-hidden="true"
//     >
//       <path
//         d="M4 20 C12 8, 20 28, 32 14 S44 6, 44 6"
//         stroke={GREEN}
//         strokeWidth="2"
//         strokeLinecap="round"
//         fill="none"
//         opacity="0.45"
//       />
//     </svg>
//   );
// }

// function DecorativeDots({ className }: { className?: string }) {
//   return (
//     <svg className={className} width="56" height="40" viewBox="0 0 56 40" aria-hidden="true">
//       {[
//         [8, 6],
//         [20, 4],
//         [32, 10],
//         [14, 18],
//         [26, 22],
//         [38, 16],
//         [10, 30],
//         [24, 34],
//         [40, 28],
//       ].map(([cx, cy], i) => (
//         <circle key={i} cx={cx} cy={cy} r="2.5" fill="#c5cfc9" opacity="0.7" />
//       ))}
//     </svg>
//   );
// }

// export default function HeroNav() {
//   return (
//     <section
//       className="relative min-h-screen overflow-hidden font-sans"
//       style={{ backgroundColor: CREAM, color: GREEN }}
//     >
//       {/* Floating products — positioned relative to full viewport */}
//       <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
//         {floatingProducts.map((product) => (
//           <img
//             key={product.alt}
//             src={product.src}
//             alt={product.alt}
//             className={`absolute z-[1] select-none drop-shadow-[0_16px_32px_rgba(0,77,61,0.12)] ${product.className}`}
//             loading="eager"
//           />
//         ))}
//         <DecorativeSquiggle className="absolute left-[9%] top-[38%] z-[1] opacity-80" />
//         <DecorativeSquiggle className="absolute right-[10%] top-[62%] z-[1] scale-x-[-1] opacity-80" />
//         <DecorativeDots className="absolute left-[11%] top-[22%] z-[1]" />
//         <DecorativeDots className="absolute right-[9%] top-[40%] z-[1]" />
//         <DecorativeDots className="absolute left-[14%] top-[66%] z-[1]" />
//       </div>

//       <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1320px] flex-col px-5 sm:px-8 lg:px-10">
//         {/* ── Nav ── */}
//         <header className="grid h-[68px] w-full shrink-0 grid-cols-[1fr_auto] items-center lg:grid-cols-[1fr_auto_1fr]">
//           <a href="/" className="flex items-center gap-2.5 justify-self-start">
//             <Layers3 className="h-7 w-7 shrink-0" style={{ color: GREEN }} strokeWidth={2.25} />
//             <span
//               className="text-[1.125rem] font-bold tracking-[-0.02em]"
//               style={{ color: GREEN }}
//             >
//               Shelf Merch
//             </span>
//           </a>

//           <nav className="hidden items-center justify-center gap-7 lg:flex lg:justify-self-center">
//             {navItems.map((item) => (
//               <a
//                 key={item.label}
//                 href={item.href}
//                 className="inline-flex items-center gap-1 text-[0.9375rem] font-medium transition-opacity hover:opacity-70"
//                 style={{ color: GREEN }}
//               >
//                 <span>{item.label}</span>
//                 {item.hasChevron ? <ChevronDown className="h-3.5 w-3.5 opacity-70" /> : null}
//               </a>
//             ))}
//           </nav>

//           <div className="hidden items-center gap-4 justify-self-end lg:flex">
//             <Link
//               to="/login"
//               className="text-[0.9375rem] font-medium transition-opacity hover:opacity-70"
//               style={{ color: GREEN }}
//             >
//               Log in
//             </Link>
//             <Button
//               asChild
//               className="h-9 rounded-full px-5 text-[0.9375rem] font-medium text-white shadow-none transition-colors hover:opacity-90"
//               style={{ backgroundColor: GREEN }}
//             >
//               <Link to="/signup">Get started</Link>
//             </Button>
//           </div>

//           <button
//             type="button"
//             className="inline-flex h-10 w-10 items-center justify-center justify-self-end rounded-lg border border-[#d4e5dc] bg-white lg:hidden"
//             style={{ color: GREEN }}
//             aria-label="Open navigation"
//           >
//             <Menu className="h-5 w-5" />
//           </button>
//         </header>

//         {/* ── Hero content ── */}
//         <div className="flex w-full flex-1 flex-col items-center pb-0 pt-6 sm:pt-8 lg:pt-10">
//           <div className="mx-auto flex w-full max-w-[680px] flex-col items-center text-center">
//             <a
//               href="#products"
//               className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[0.8125rem] font-medium transition-opacity hover:opacity-80"
//               style={{ backgroundColor: "#e8f2ec", color: GREEN }}
//             >
//               <span className="font-semibold">NEW</span>
//               <span>Spring collection now available</span>
//               <ChevronRight className="h-3.5 w-3.5" />
//             </a>

//             <h1
//               className="mt-5 text-balance text-center text-[clamp(2.5rem,5.2vw,4.25rem)] font-bold leading-[1.05] tracking-[-0.03em]"
//               style={{ color: GREEN }}
//             >
//               The easy way to
//               <br />
//               sell merch online
//             </h1>

//             <p
//               className="mx-auto mt-4 max-w-[560px] text-pretty text-center text-[clamp(1rem,1.4vw,1.1875rem)] leading-[1.55] font-normal"
//               style={{ color: MUTED }}
//             >
//               Create custom merch, build your branded store, and we handle printing,
//               shipping, and customer support.
//             </p>

//             <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
//               <Button
//                 asChild
//                 className="h-11 min-w-[196px] rounded-full px-7 text-[0.9375rem] font-medium text-white shadow-none transition-colors hover:opacity-90"
//                 style={{ backgroundColor: GREEN }}
//               >
//                 <Link to="/signup">Get started for free</Link>
//               </Button>
//               <Button
//                 variant="outline"
//                 className="h-11 min-w-[152px] rounded-full bg-white px-7 text-[0.9375rem] font-medium shadow-none transition-colors hover:bg-[#f3f7f5]"
//                 style={{ borderColor: "#b8ccc4", color: GREEN }}
//               >
//                 Book a demo
//               </Button>
//             </div>

//             <div
//               className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[0.8125rem]"
//               style={{ color: MUTED }}
//             >
//               {trustItems.map((item, index) => {
//                 const Icon = item.icon;
//                 return (
//                   <div key={item.label} className="inline-flex items-center gap-3">
//                     {index > 0 ? (
//                       <span
//                         className="hidden h-1 w-1 rounded-full sm:inline-block"
//                         style={{ backgroundColor: "#b8ccc4" }}
//                         aria-hidden="true"
//                       />
//                     ) : null}
//                     <div className="inline-flex items-center gap-1.5">
//                       <Icon className="h-3.5 w-3.5" style={{ color: GREEN }} strokeWidth={2} />
//                       <span>{item.label}</span>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Template mockup */}
//           <div className="mx-auto mt-10 w-full max-w-[920px] px-2 sm:mt-12 lg:mt-14">
//             <div className="overflow-hidden rounded-[20px] border border-[#e0ebe6] bg-white shadow-[0_24px_64px_-20px_rgba(0,77,61,0.18)]">
//               <img
//                 src={templateAsset}
//                 alt="Shelf Merch editor interface for creating a branded hoodie design"
//                 className="block w-full object-contain"
//                 loading="eager"
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

import { Button } from "@/components/ui/button";
import hoodieAsset from "../../assets/hoodie.png";
import toteAsset from "../../assets/tote.png";
import mugAsset from "../../assets/mug.png";
import capAsset from "../../assets/cap.png";
import bottleAsset from "../../assets/bottle.png";
import diaryAsset from "../../assets/diary.png";
import templateAsset from "../../assets/template.png";
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
            <img src={logoMark} alt="Shelf Merch logo" className="h-8 w-8" loading="eager" />
            <span className="text-[20px] font-semibold tracking-normal">Shelf Merch</span>
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
