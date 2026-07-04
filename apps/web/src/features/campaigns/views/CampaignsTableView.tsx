import { Box, CalendarDays, Search, Settings2, Users } from "lucide-react";
import { COMPLETE_STATUSES, isLiveCampaign, isPointsCampaign, isSentKitCampaign } from "../model";
import type { UiCampaign } from "../model";
import type { CampaignFilter, CampaignStats } from "../controllers/useCampaignsController";
import { CAMPAIGN_FILTERS } from "../controllers/useCampaignsController";

const TAB_LABELS: Record<CampaignFilter, string> = {
  all: "All",
  live: "Live",
  draft: "Draft",
  completed: "Completed",
};

function statusTag(c: UiCampaign) {
  if (isSentKitCampaign(c))
    return (
      <span className="tag tag-live">
        <span className="dot" />
        Sent
      </span>
    );
  if (isLiveCampaign(c))
    return (
      <span className="tag tag-live">
        <span className="dot" />
        Live
      </span>
    );
  if (c.status === "scheduled")
    return (
      <span className="tag tag-sched">
        <span className="dot" />
        Scheduled
      </span>
    );
  if (c.status === "draft")
    return (
      <span className="tag tag-camp-draft">
        <span className="dot" />
        Draft
      </span>
    );
  if (COMPLETE_STATUSES.includes(c.status))
    return (
      <span className="tag tag-completed">
        <span className="dot" />
        Completed
      </span>
    );
  return <span className="tag tag-proc">{c.status}</span>;
}

function typeLabel(type: string) {
  const points = type === "send_points" || type === "points";
  return (
    <span className="camp-type">
      {points ? <CalendarDays size={14} /> : <Box size={14} />}
      {points ? "Send points" : "Kit send"}
    </span>
  );
}

function campaignTitle(c: UiCampaign) {
  if (isPointsCampaign(c)) return c.name;
  return `Kit send: ${c.name}`;
}

function campaignSubtext(c: UiCampaign) {
  if (isPointsCampaign(c)) return null;
  return `From kit: ${c.name}`;
}

function CampaignAvatar({ c }: { c: UiCampaign }) {
  const points = isPointsCampaign(c);
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

/** Campaigns table with stats, filter tabs, search and pagination — all state via props. */
export function CampaignsTableView({
  stats,
  filter,
  search,
  pageItems,
  page,
  totalPages,
  totalFiltered,
  showingStart,
  showingEnd,
  canSend,
  onFilter,
  onSearch,
  onPage,
  onSendGift,
}: {
  stats: CampaignStats;
  filter: CampaignFilter;
  search: string;
  pageItems: UiCampaign[];
  page: number;
  totalPages: number;
  totalFiltered: number;
  showingStart: number;
  showingEnd: number;
  canSend: boolean;
  onFilter: (filter: CampaignFilter) => void;
  onSearch: (search: string) => void;
  onPage: (page: number) => void;
  onSendGift: () => void;
}) {
  return (
    <>
      <div className="page-h">
        <div>
          <h1>Campaigns</h1>
          <div className="sub">Track points campaigns and kit-send history.</div>
        </div>
        {canSend ? (
          <button type="button" className="btn btn-dark" onClick={onSendGift}>
            Send Gift
          </button>
        ) : null}
      </div>

      <div className="camp-stats">
        <StatCard icon={<CalendarDays size={18} />} label="Total campaigns" value={stats.total} />
        <StatCard
          icon={<span className="dot" style={{ background: "var(--brand-l)" }} />}
          label="Live"
          value={stats.live}
          liveDot
        />
        <StatCard icon={<Settings2 size={18} />} label="Draft" value={stats.draft} />
        <StatCard
          icon={<Users size={18} />}
          label="Recipients reached"
          value={stats.recipients.toLocaleString("en-IN")}
        />
      </div>

      <div className="camp-toolbar">
        <div className="search camp-search">
          <Search size={16} aria-hidden="true" />
          <input
            placeholder="Search campaigns"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <div className="camp-filter-tabs">
          {CAMPAIGN_FILTERS.map((t) => (
            <button
              key={t}
              type="button"
              className={`camp-filter-btn${filter === t ? " on" : ""}`}
              onClick={() => onFilter(t)}
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
                      <span>
                        <span style={{ display: "block", fontWeight: 600 }}>
                          {campaignTitle(c)}
                        </span>
                        {campaignSubtext(c) ? (
                          <span
                            className="muted"
                            style={{ display: "block", fontSize: 12, marginTop: 2 }}
                          >
                            {campaignSubtext(c)}
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </td>
                  <td>{typeLabel(c.type)}</td>
                  <td>{statusTag(c)}</td>
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
              className={`camp-page-btn${page <= 1 ? " disabled" : ""}`}
              disabled={page <= 1}
              onClick={() => onPage(page - 1)}
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                className={`camp-page-btn${n === page ? " on" : ""}`}
                onClick={() => onPage(n)}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              className={`camp-page-btn${page >= totalPages ? " disabled" : ""}`}
              disabled={page >= totalPages}
              onClick={() => onPage(page + 1)}
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </>
  );
}
