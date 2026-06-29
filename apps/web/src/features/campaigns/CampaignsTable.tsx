import { useState } from "react";
import { Box, CalendarDays, Search, Settings2, Users } from "lucide-react";
import type { UiCampaign } from "@/services/mappers";

const PER_PAGE = 5;
const TABS = ["all", "live", "draft", "completed"] as const;
const TAB_LABELS: Record<(typeof TABS)[number], string> = {
  all: "All",
  live: "Live",
  draft: "Draft",
  completed: "Completed",
};

const LIVE = ["live", "launched", "redemption_open"];
const COMPLETE = ["completed", "redemption_closed", "fulfilled"];

function statusTag(status: string) {
  if (LIVE.includes(status))
    return (
      <span className="tag tag-live">
        <span className="dot" />
        Live
      </span>
    );
  if (status === "scheduled")
    return (
      <span className="tag tag-sched">
        <span className="dot" />
        Scheduled
      </span>
    );
  if (status === "draft")
    return (
      <span className="tag tag-camp-draft">
        <span className="dot" />
        Draft
      </span>
    );
  if (COMPLETE.includes(status))
    return (
      <span className="tag tag-completed">
        <span className="dot" />
        Completed
      </span>
    );
  return <span className="tag tag-proc">{status}</span>;
}

function typeLabel(type: string) {
  const points = type === "send_points" || type === "points";
  return (
    <span className="camp-type">
      {points ? <CalendarDays size={14} /> : <Box size={14} />}
      {points ? "Send points" : "Send a kit"}
    </span>
  );
}

function CampaignAvatar({ c }: { c: UiCampaign }) {
  const points = c.type === "send_points" || c.type === "points";
  return (
    <div className="camp-avatar" style={{ background: "#15784C" }}>
      {points ? <CalendarDays size={16} color="#fff" /> : <Box size={16} color="#fff" />}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  liveDot = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  liveDot?: boolean;
}) {
  return (
    <div className="camp-stat-card">
      <div className={`camp-stat-icon${liveDot ? " camp-stat-icon-live" : ""}`}>{icon}</div>
      <div>
        <span className="camp-stat-label">{label}</span>
        <span className="camp-stat-value">{value}</span>
      </div>
    </div>
  );
}

/** Campaigns table with stats, filter tabs, search and pagination. */
export function CampaignsTable({
  campaigns,
  onSendGift,
}: {
  campaigns: UiCampaign[];
  onSendGift: () => void;
}) {
  const [filter, setFilter] = useState<(typeof TABS)[number]>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const totalCamp = campaigns.length;
  const liveCount = campaigns.filter((c) => LIVE.includes(c.status)).length;
  const draftCount = campaigns.filter((c) => c.status === "draft").length;
  const totalRecipients = campaigns.reduce((s, c) => s + (c.recipientCount || 0), 0);

  let filtered = campaigns;
  if (filter === "live") filtered = filtered.filter((c) => LIVE.includes(c.status));
  else if (filter === "draft") filtered = filtered.filter((c) => c.status === "draft");
  else if (filter === "completed") filtered = filtered.filter((c) => COMPLETE.includes(c.status));
  const q = search.toLowerCase();
  if (q) filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const pageItems = filtered.slice(start, start + PER_PAGE);
  const showingStart = totalFiltered ? start + 1 : 0;
  const showingEnd = Math.min(start + PER_PAGE, totalFiltered);

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Campaigns</h1>
          <div className="sub">Launch points campaigns and track redemptions.</div>
        </div>
        <button type="button" className="btn btn-dark" onClick={onSendGift}>
          Send Gift
        </button>
      </div>

      <div className="camp-stats">
        <StatCard icon={<CalendarDays size={18} />} label="Total campaigns" value={totalCamp} />
        <StatCard
          icon={<span className="dot" style={{ background: "var(--brand-l)" }} />}
          label="Live"
          value={liveCount}
          liveDot
        />
        <StatCard icon={<Settings2 size={18} />} label="Draft" value={draftCount} />
        <StatCard
          icon={<Users size={18} />}
          label="Recipients reached"
          value={totalRecipients.toLocaleString("en-IN")}
        />
      </div>

      <div className="camp-toolbar">
        <div className="search camp-search">
          <Search size={16} aria-hidden="true" />
          <input
            placeholder="Search campaigns"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="camp-filter-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`camp-filter-btn${filter === t ? " on" : ""}`}
              onClick={() => {
                setFilter(t);
                setPage(1);
              }}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="tbl camp-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Type</th>
              <th>Status</th>
              <th>Recipients</th>
              <th>Redemptions</th>
              <th>Launch date</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {pageItems.length ? (
              pageItems.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="camp-name-cell">
                      <CampaignAvatar c={c} />
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                    </div>
                  </td>
                  <td>{typeLabel(c.type)}</td>
                  <td>{statusTag(c.status)}</td>
                  <td className="num">{c.recipientCount.toLocaleString("en-IN")}</td>
                  <td className="num">—</td>
                  <td className="num">—</td>
                  <td />
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--ink-2)" }}>
                  No campaigns match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="camp-pagination">
        <span className="camp-page-info">
          Showing {showingStart} to {showingEnd} of {totalFiltered} campaigns
        </span>
        {totalPages > 1 && (
          <div className="camp-page-btns">
            <button
              type="button"
              className={`camp-page-btn${safePage <= 1 ? " disabled" : ""}`}
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                className={`camp-page-btn${n === safePage ? " on" : ""}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              className={`camp-page-btn${safePage >= totalPages ? " disabled" : ""}`}
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </>
  );
}
