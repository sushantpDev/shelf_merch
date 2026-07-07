import { type ComponentType, useState, useMemo } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  Gift,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import type { UiKit } from "../model";
import type { KitsVm } from "../controllers/useKitsController";
import scaleYourGiftingImg from "../../../../assets/scale_your_gifting.png";
import wellnessKitImg from "../../../../assets/wellness-kit.png";
import workFromHomeKitImg from "../../../../assets/work-from-home-kit.png";
import kitPreviewImg from "../../../../assets/kit-preview.png";
import "../kits-page.css";

type StatCardProps = {
  label: string;
  value: string;
  delta: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
};

type KitRow = {
  id: string;
  name: string;
  description: string;
  audience: string;
  image: string;
  items: number;
  status: "live" | "draft" | "archived";
  lastSent: string;
  sentDate: string;
  featured?: boolean;
  /** Present only for real workspace kits; absent for default sample rows. */
  kit?: UiKit;
};

// ─── 24 default static kits (16 live + 5 draft + 3 archived) ─────────────────

const IMAGES = [scaleYourGiftingImg, wellnessKitImg, kitPreviewImg, workFromHomeKitImg];
const AUDIENCES = ["Onboarding", "Client Gifts", "Festival", "Rewards", "HR Essentials", "Corporate"];

const DEFAULT_KITS: KitRow[] = (() => {
  const rows: KitRow[] = [];

  const liveNames = [
    ["Welcome Kit", "New joiner welcome kit with essentials to get started.", true],
    ["Client Appreciation Kit", "A premium kit to thank and delight your top clients.", false],
    ["Diwali Gift Box", "Celebrate the festival of lights with our special Diwali kit.", true],
    ["Holi Celebration Box", "Splash colours and joy with this festive hamper.", false],
    ["Employee Anniversary Kit", "Honour work anniversaries with a personalised touch.", false],
    ["Sales Champion Kit", "Reward top performers with a premium curated collection.", false],
    ["Remote Work Essentials", "Everything a remote worker needs to stay productive.", false],
    ["Leadership Induction Kit", "A thoughtful kit for newly promoted leaders.", false],
    ["Brand Ambassador Box", "Branded merchandise kit for your brand evangelists.", false],
    ["Health & Wellness Kit", "Promote employee wellbeing with curated wellness products.", false],
    ["Summer Vibes Kit", "Cool summer essentials to beat the heat.", false],
    ["Team Offsite Kit", "A curated box for team building & offsite events.", false],
    ["Year-End Thank You Kit", "Show gratitude to clients and partners at year-end.", false],
    ["New Parent Kit", "Celebrate new parents with a thoughtful gift bundle.", false],
    ["Tech Starter Kit", "Essential tech accessories for new employees.", false],
    ["Sustainability Kit", "Eco-friendly products that show you care about the planet.", false],
  ] as [string, string, boolean][];

  for (let i = 0; i < 16; i++) {
    const [name, description, featured] = liveNames[i];
    rows.push({
      id: `default-live-${i + 1}`,
      name,
      description,
      audience: AUDIENCES[i % AUDIENCES.length],
      image: IMAGES[i % IMAGES.length],
      items: 3 + (i % 6),
      status: "live",
      lastSent: `${i + 2} days ago`,
      sentDate: `May ${30 - i}, 2026`,
      featured,
    });
  }

  const draftNames = [
    ["Employee Milestone Kit", "Recognize milestones and celebrate achievements."],
    ["Referral Reward Kit", "Thank employees who bring in top talent."],
    ["Conference Swag Kit", "Branded swag for your next conference or expo."],
    ["Partner Gift Kit", "Curated hamper for valued business partners."],
    ["Holiday Season Kit", "Seasonal gift box to spread festive cheer."],
  ] as [string, string][];

  for (let i = 0; i < 5; i++) {
    const [name, description] = draftNames[i];
    rows.push({
      id: `default-draft-${i + 1}`,
      name,
      description,
      audience: AUDIENCES[(i + 2) % AUDIENCES.length],
      image: IMAGES[(i + 1) % IMAGES.length],
      items: 4 + (i % 4),
      status: "draft",
      lastSent: "-",
      sentDate: "Never sent",
    });
  }

  const archivedNames = [
    ["2024 Rakhi Kit", "Archived Rakhi hamper from last season."],
    ["Q4 2024 Sales Kit", "Historical kit for Q4 outreach — now archived."],
    ["Legacy Onboarding Box", "Replaced by the Welcome Kit; kept for reference."],
  ] as [string, string][];

  for (let i = 0; i < 3; i++) {
    const [name, description] = archivedNames[i];
    rows.push({
      id: `default-archived-${i + 1}`,
      name,
      description,
      audience: AUDIENCES[(i + 4) % AUDIENCES.length],
      image: IMAGES[(i + 2) % IMAGES.length],
      items: 5,
      status: "archived",
      lastSent: "Last year",
      sentDate: "Dec 15, 2025",
    });
  }

  return rows;
})();

// ─── Activity feed (static for now) ─────────────────────────────────────────

const ACTIVITY = [
  { icon: Send, title: "Welcome Kit sent to 35 recipients", meta: "by Priya Sharma - 2 days ago" },
  { icon: CheckCircle2, title: "Client Appreciation Kit delivered", meta: "to 22 recipients - 5 days ago" },
  { icon: Gift, title: "Diwali Gift Box sent to 120 recipients", meta: "by Rohan Mehta - 12 days ago" },
  { icon: Pencil, title: "Employee Milestone Kit updated", meta: "by Neha Verma - 15 days ago" },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, delta, icon: Icon }: StatCardProps) {
  return (
    <article className="kits-stat">
      <div className="kits-stat__icon">
        <Icon size={24} strokeWidth={1.9} />
      </div>
      <div>
        <div className="kits-stat__label">{label}</div>
        <div className="kits-stat__value num">{value}</div>
      </div>
      <div className="kits-stat__delta">{delta}</div>
    </article>
  );
}

// ─── Main view ───────────────────────────────────────────────────────────────

/** Kits dashboard: hero, stats, kit list with tab filters, and insights sidebar. */
export function KitsView(vm: KitsVm) {
  // All hooks must come before any early returns.
  const [activeTab, setActiveTab] = useState<"all" | "live" | "draft" | "archived">("all");

  /** Map real workspace kits into KitRow shape (prepended before defaults). */
  const workspaceRows = useMemo<KitRow[]>(() => {
    return vm.kits.map((kit): KitRow => ({
      id: kit.id,
      name: kit.name,
      description: "Custom kit created in your workspace.",
      audience: "Workspace",
      image: kitPreviewImg,
      items: kit.items,
      status: kit.status === "live" ? "live" : kit.status === "archived" ? "archived" : "draft",
      lastSent: kit.sent ? "Recently" : "-",
      sentDate: kit.sent ? "Recent" : "Never sent",
      kit,
    }));
  }, [vm.kits]);

  /** Workspace kits first, then the 24 defaults. */
  const allKits = useMemo<KitRow[]>(
    () => [...workspaceRows, ...DEFAULT_KITS],
    [workspaceRows],
  );

  const stats = useMemo(() => {
    const live = allKits.filter((k) => k.status === "live").length;
    const drafts = allKits.filter((k) => k.status === "draft").length;
    const archived = allKits.filter((k) => k.status === "archived").length;
    return { total: live + drafts + archived, live, drafts, archived };
  }, [allKits]);

  const filteredRows = useMemo(
    () => (activeTab === "all" ? allKits : allKits.filter((r) => r.status === activeTab)),
    [allKits, activeTab],
  );

  const displayedRows = useMemo(
    () => (vm.showAll ? filteredRows : filteredRows.slice(0, vm.previewLimit)),
    [filteredRows, vm.showAll, vm.previewLimit],
  );

  // ── Early returns (after all hooks) ──
  if (vm.isLoading) return <LoadingState message="Loading kits..." fullScreen={false} />;
  if (vm.errorMessage) {
    return (
      <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
        {vm.errorMessage}
      </div>
    );
  }

  const { canCreateKits, canSendKits } = vm;

  return (
    <section className="kits-dashboard" aria-label="Kits and Items dashboard">
      <div className="kits-dashboard__grid">

        {/* ── Left: main list ── */}
        <div className="kits-dashboard__main">

          {/* Hero */}
          <div className="kits-hero-row">
            <div>
              <h1>Kits &amp; Items</h1>
              <p>Create reusable gift kits with your products and send them at scale.</p>
            </div>
            {canCreateKits && (
              <Link to="/app/kits/new" className="kits-create-btn">
                <Plus size={18} strokeWidth={2.4} />
                Create a kit
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="kits-stats-grid">
            <StatCard label="Total kits" value={String(stats.total)} delta="18% vs last month" icon={Gift} />
            <StatCard label="Live kits" value={String(stats.live)} delta="22% vs last month" icon={Sparkles} />
            <StatCard label="Sent this month" value="312" delta="29% vs last month" icon={Send} />
            <StatCard label="Recipients reached" value="1,842" delta="35% vs last month" icon={Users} />
          </div>

          {/* List card */}
          <div className="kits-list-card">

            {/* Toolbar */}
            <div className="kits-list-toolbar">
              <div className="kits-tabs" aria-label="Kit filters">
                {(["all", "live", "draft", "archived"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`kits-tab${activeTab === tab ? " kits-tab--active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === "all" ? "All kits" : tab === "draft" ? "Drafts" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    <span>
                      {tab === "all" ? stats.total : tab === "live" ? stats.live : tab === "draft" ? stats.drafts : stats.archived}
                    </span>
                  </button>
                ))}
              </div>

              <div className="kits-tools">
                <label className="kits-search">
                  <Search size={18} aria-hidden="true" />
                  <input placeholder="Search kits" aria-label="Search kits" />
                </label>
                <button type="button" className="kits-tool-btn">
                  <SlidersHorizontal size={17} /> Filters
                </button>
                <button type="button" className="kits-tool-btn">
                  <ArrowUpDown size={17} /> Sort <ChevronDown size={15} />
                </button>
              </div>
            </div>

            {/* Table rows */}
            <div className="kits-table" role="table" aria-label="Your kits">
              {displayedRows.map((row) => (
                <div className="kits-table__row" role="row" key={row.id}>

                  {/* Kit cell — image + name link to detail page for workspace kits */}
                  <div className="kits-kit-cell">
                    {row.kit ? (
                      <Link to={`/app/kits/${row.id}`}>
                        <img src={row.image} alt="" />
                      </Link>
                    ) : (
                      <img src={row.image} alt="" />
                    )}
                    <div>
                      <div className="kits-kit-title">
                        {row.kit ? (
                          <Link to={`/app/kits/${row.id}`} className="lnk">{row.name}</Link>
                        ) : (
                          <span>{row.name}</span>
                        )}
                        {row.featured && (
                          <span className="kits-featured">
                            <Star size={11} fill="currentColor" /> Featured
                          </span>
                        )}
                      </div>
                      <p>{row.description}</p>
                      <span className="kits-audience">{row.audience}</span>
                    </div>
                  </div>

                  {/* Items count */}
                  <div className="kits-metric-cell">
                    <span>Items</span>
                    <strong>{row.items}</strong>
                  </div>

                  {/* Status badge */}
                  <div className="kits-metric-cell">
                    <span>Status</span>
                    <strong className={`kits-status kits-status--${row.status}`}>
                      <i />
                      {row.status === "live" ? "Live" : row.status === "archived" ? "Archived" : "Draft"}
                    </strong>
                  </div>

                  {/* Last sent */}
                  <div className="kits-sent-cell">
                    <span>Last sent</span>
                    <strong>{row.lastSent}</strong>
                    <em>{row.sentDate}</em>
                  </div>

                  {/* Actions — Edit + Send always shown (if permitted) */}
                  <div className="kits-row-actions">
                    {/* Edit */}
                    {canCreateKits && (
                      row.kit ? (
                        <Link to={`/app/kits/${row.id}/edit`} className="kits-row-btn">Edit</Link>
                      ) : (
                        <Link to="/app/kits/new" className="kits-row-btn">Edit</Link>
                      )
                    )}

                    {/* Send → /app/kits/:id/send → RecipientPicker → RecipientExperience → PaymentPanel */}
                    {canSendKits && (
                      row.kit ? (
                        <Link to={`/app/kits/${row.id}/send`} className="kits-send-btn">Send</Link>
                      ) : (
                        <Link to="/app/kits/new" className="kits-send-btn">Send</Link>
                      )
                    )}

                    <button
                      type="button"
                      className="kits-more-btn"
                      aria-label={`More actions for ${row.name}`}
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="kits-list-footer">
              <span>
                {vm.showAll
                  ? `Showing all ${filteredRows.length} kit${filteredRows.length === 1 ? "" : "s"}`
                  : `Showing 1–${Math.min(vm.previewLimit, filteredRows.length)} of ${filteredRows.length} kits`}
              </span>
              {filteredRows.length > vm.previewLimit && !vm.showAll ? (
                <button type="button" className="kits-view-all" onClick={() => vm.onShowAll(true)}>
                  View all kits <ArrowRight size={17} />
                </button>
              ) : vm.showAll && filteredRows.length > vm.previewLimit ? (
                <button type="button" className="kits-view-all" onClick={() => vm.onShowAll(false)}>
                  Show fewer
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── Right: sidebar ── */}
        <aside className="kits-dashboard__side" aria-label="Kits insights">
          <section className="kits-promo">
            <img src={scaleYourGiftingImg} alt="Scale your gifting with reusable branded kits" />
          </section>

          <section className="kits-side-card kits-activity">
            <div className="kits-side-card__head">
              <h2>Recent activity</h2>
              <Link to="/app/orders">View all</Link>
            </div>
            <div className="kits-activity__list">
              {ACTIVITY.map(({ icon: Icon, title, meta }) => (
                <div className="kits-activity__item" key={title}>
                  <span className="kits-activity__icon">
                    <Icon size={18} strokeWidth={1.8} />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <p>{meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="kits-side-card kits-insights">
            <div className="kits-side-card__head">
              <h2>Delivery insights</h2>
              <button type="button">This month <ChevronDown size={15} /></button>
            </div>
            <div className="kits-insights__grid">
              <div>
                <span><Send size={19} /></span>
                <strong>312</strong>
                <p>Kits sent</p>
                <em>29%</em>
              </div>
              <div>
                <span><Users size={19} /></span>
                <strong>1,842</strong>
                <p>Recipients</p>
                <em>35%</em>
              </div>
              <div>
                <span><CheckCircle2 size={19} /></span>
                <strong>98%</strong>
                <p>Delivery rate</p>
                <em>6%</em>
              </div>
              <div>
                <span><Star size={19} /></span>
                <strong>4.8/5</strong>
                <p>Avg. rating</p>
                <em>0.2</em>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
