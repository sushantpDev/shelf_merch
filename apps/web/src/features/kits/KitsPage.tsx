import { type ComponentType, useState } from "react";
import { Link } from "@tanstack/react-router";
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
import { useWorkspace } from "@/hooks/useWorkspace";
import { useTenantAccess } from "@/hooks/useTenantAccess";

import { KitsEmptyState } from "./KitsEmptyState";

import type { UiKit } from "@/services/mappers";
import scaleYourGiftingImg from "../../../assets/scale_your_gifting.png";
import wellnessKitImg from "../../../assets/wellness-kit.png";
import workFromHomeKitImg from "../../../assets/work-from-home-kit.png";
import kitPreviewImg from "../../../assets/kit-preview.png";
import "./kits-page.css";


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
  status: "live" | "draft";
  lastSent: string;
  sentDate: string;
  featured?: boolean;
  kit?: UiKit;
};

const SAMPLE_ROWS: KitRow[] = [
  {
    id: "sample-welcome",
    name: "Welcome Kit",
    description: "New joiner welcome kit with essentials to get started.",
    audience: "Onboarding",
    image: scaleYourGiftingImg,
    items: 5,
    status: "live",
    lastSent: "2 days ago",
    sentDate: "May 30, 2026",
    featured: true,
  },
  {
    id: "sample-client",
    name: "Client Appreciation Kit",
    description: "A premium kit to thank and delight your top clients.",
    audience: "Client Gifts",
    image: wellnessKitImg,
    items: 7,
    status: "live",
    lastSent: "5 days ago",
    sentDate: "May 27, 2026",
  },
  {
    id: "sample-diwali",
    name: "Diwali Gift Box",
    description: "Celebrate the festival of lights with our special Diwali kit.",
    audience: "Festival",
    image: kitPreviewImg,
    items: 6,
    status: "live",
    lastSent: "12 days ago",
    sentDate: "May 20, 2026",
  },
  {
    id: "sample-milestone",
    name: "Employee Milestone Kit",
    description: "Recognize milestones and celebrate achievements.",
    audience: "Rewards",
    image: workFromHomeKitImg,
    items: 4,
    status: "draft",
    lastSent: "-",
    sentDate: "Never sent",
  },
];

const ACTIVITY = [
  {
    icon: Send,
    title: "Welcome Kit sent to 35 recipients",
    meta: "by Priya Sharma - 2 days ago",
  },
  {
    icon: CheckCircle2,
    title: "Client Appreciation Kit delivered",
    meta: "to 22 recipients - 5 days ago",
  },
  {
    icon: Gift,
    title: "Diwali Gift Box sent to 120 recipients",
    meta: "by Rohan Mehta - 12 days ago",
  },
  {
    icon: Pencil,
    title: "Employee Milestone Kit updated",
    meta: "by Neha Verma - 15 days ago",
  },
];

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

function kitRowsFromWorkspace(
  kits: UiKit[],
  options?: { limit?: number; padWithSamples?: boolean },
): KitRow[] {
  const limit = options?.limit;
  const padWithSamples = options?.padWithSamples ?? false;
  const source = limit != null ? kits.slice(0, limit) : kits;
  const mapped = source.map((kit, index): KitRow => {
    const sample = SAMPLE_ROWS[index] ?? SAMPLE_ROWS[0];
    return {
      ...sample,
      id: kit.id,
      name: kit.name || sample.name,
      items: kit.items || sample.items,
      status: kit.status === "live" ? "live" : "draft",
      lastSent: kit.sent ? sample.lastSent : "-",
      sentDate: kit.sent ? sample.sentDate : "Never sent",
      kit,
    };
  });

  if (padWithSamples && limit != null) {
    return [...mapped, ...SAMPLE_ROWS.slice(mapped.length)].slice(0, limit);
  }
  return mapped;
}

export function KitsPage() {
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const { canCreateKits, canSendKits } = useTenantAccess();
  const [showAll, setShowAll] = useState(false);

  const previewLimit = 4;

  if (isLoading && !workspace) {
    return <LoadingState message="Loading kits..." fullScreen={false} />;
  }
  if (isError || !workspace) {
    return (
      <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
        {error instanceof Error ? error.message : "Could not load kits"}
      </div>
    );
  }

  const kits = workspace.kits;
  const total = Math.max(kits.length, 24);
  const live = Math.max(kits.filter((k) => k.status === "live").length, 16);
  const drafts = Math.max(kits.filter((k) => k.status !== "live").length, 5);
  const rows = kitRowsFromWorkspace(
    kits,
    showAll ? undefined : { limit: previewLimit, padWithSamples: true },
  );
  const hasMoreKits = kits.length > previewLimit;

  return (
    <section className="kits-dashboard" aria-label="Kits and Items dashboard">
      <div className="kits-dashboard__grid">
        <div className="kits-dashboard__main">
          <div className="kits-hero-row">
            <div>
              <h1>Kits &amp; Items</h1>
              <p>Create reusable gift kits with your products and send them at scale.</p>
            </div>
            {canCreateKits ? (
              <Link to="/app/kits/new" className="kits-create-btn">
                <Plus size={18} strokeWidth={2.4} />
                Create a kit
              </Link>
            ) : null}
          </div>

          <div className="kits-stats-grid">
            <StatCard
              label="Total kits"
              value={String(total)}
              delta="18% vs last month"
              icon={Gift}
            />
            <StatCard
              label="Live kits"
              value={String(live)}
              delta="22% vs last month"
              icon={Sparkles}
            />
            <StatCard label="Sent this month" value="312" delta="29% vs last month" icon={Send} />
            <StatCard
              label="Recipients reached"
              value="1,842"
              delta="35% vs last month"
              icon={Users}
            />
          </div>

          <div className="kits-list-card">
            <div className="kits-list-toolbar">
              <div className="kits-tabs" aria-label="Kit filters">
                <button type="button" className="kits-tab kits-tab--active">
                  All kits <span>{total}</span>
                </button>
                <button type="button" className="kits-tab">
                  Live <span>{live}</span>
                </button>
                <button type="button" className="kits-tab">
                  Drafts <span>{drafts}</span>
                </button>
                <button type="button" className="kits-tab">
                  Archived <span>3</span>
                </button>
              </div>

              <div className="kits-tools">
                <label className="kits-search">
                  <Search size={18} aria-hidden="true" />
                  <input placeholder="Search kits" aria-label="Search kits" />
                </label>
                <button type="button" className="kits-tool-btn">
                  <SlidersHorizontal size={17} />
                  Filters
                </button>
                <button type="button" className="kits-tool-btn">
                  <ArrowUpDown size={17} />
                  Sort
                  <ChevronDown size={15} />
                </button>
              </div>
            </div>

            <div className="kits-table" role="table" aria-label="Your kits">
              {rows.map((row) => (
                <div className="kits-table__row" role="row" key={row.id}>
                  <div className="kits-kit-cell">
                    <img src={row.image} alt="" />
                    <div>
                      <div className="kits-kit-title">
                        {row.kit ? (
                          <Link to="/app/kits/$id" params={{ id: row.id }} className="lnk">
                            {row.name}
                          </Link>
                        ) : (
                          row.name
                        )}
                        {row.featured && (
                          <span className="kits-featured">
                            <Star size={11} fill="currentColor" />
                            Featured
                          </span>
                        )}
                      </div>
                      <p>{row.description}</p>
                      <span className="kits-audience">{row.audience}</span>
                    </div>
                  </div>

                  <div className="kits-metric-cell">
                    <span>Items</span>
                    <strong>{row.items}</strong>
                  </div>

                  <div className="kits-metric-cell">
                    <span>Status</span>
                    <strong className={`kits-status kits-status--${row.status}`}>
                      <i />
                      {row.status === "live" ? "Live" : "Draft"}
                    </strong>
                  </div>

                  <div className="kits-sent-cell">
                    <span>Last sent</span>
                    <strong>{row.lastSent}</strong>
                    <em>{row.sentDate}</em>
                  </div>

                  <div className="kits-row-actions">
                    {row.kit ? (
                      <Link
                        to="/app/kits/$id"
                        params={{ id: row.id }}
                        className="kits-row-btn"
                      >
                        View
                      </Link>
                    ) : (
                      <button type="button" className="kits-row-btn" disabled>
                        View
                      </button>
                    )}
                    {row.status === "live" && row.kit && canSendKits ? (
                      <Link
                        to="/app/kits/$id/send"
                        params={{ id: row.id }}
                        className="kits-send-btn"
                      >
                        Send
                      </Link>
                    ) : row.status === "live" && canSendKits ? (
                      <Link to="/app/kits/new" className="kits-send-btn">
                        Send
                      </Link>
                    ) : row.kit && canCreateKits ? (
                      <Link
                        to="/app/kits/$id/edit"
                        params={{ id: row.id }}
                        className="kits-row-btn"
                      >
                        Edit
                      </Link>
                    ) : canCreateKits ? (
                      <Link to="/app/kits/new" className="kits-row-btn">
                        Edit
                      </Link>
                    ) : null}
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

            <div className="kits-list-footer">
              <span>
                {showAll
                  ? `Showing all ${kits.length} kit${kits.length === 1 ? "" : "s"}`
                  : `Showing 1-${Math.min(previewLimit, rows.length)} of ${total} kits`}
              </span>
              {hasMoreKits && !showAll ? (
                <button
                  type="button"
                  className="kits-view-all"
                  onClick={() => setShowAll(true)}
                >
                  View all kits <ArrowRight size={17} />
                </button>
              ) : showAll && hasMoreKits ? (
                <button
                  type="button"
                  className="kits-view-all"
                  onClick={() => setShowAll(false)}
                >
                  Show fewer
                </button>
              ) : null}
            </div>
          </div>
        </div>

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
              <button type="button">
                This month <ChevronDown size={15} />
              </button>
            </div>
            <div className="kits-insights__grid">
              <div>
                <span>
                  <Send size={19} />
                </span>
                <strong>312</strong>
                <p>Kits sent</p>
                <em>29%</em>
              </div>
              <div>
                <span>
                  <Users size={19} />
                </span>
                <strong>1,842</strong>
                <p>Recipients</p>
                <em>35%</em>
              </div>
              <div>
                <span>
                  <CheckCircle2 size={19} />
                </span>
                <strong>98%</strong>
                <p>Delivery rate</p>
                <em>6%</em>
              </div>
              <div>
                <span>
                  <Star size={19} />
                </span>
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
