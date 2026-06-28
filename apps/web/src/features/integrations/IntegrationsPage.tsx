import { useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { INTEGRATIONS, INTEG_CATEGORIES, categoryMeta, type Integration } from "./data";

function IntegrationCard({ app }: { app: Integration }) {
  const on = app.connected;
  return (
    <article className={`integ-card${on ? " integ-card--connected" : ""}`}>
      <div className="integ-card-top">
        <div className="integ-logo">
          <img src={app.icon} alt={`${app.name} logo`} />
        </div>
        {on ? (
          <span className="tag tag-live integ-status">
            <span className="dot" />
            Connected
          </span>
        ) : (
          <span className="integ-status integ-status-idle">Not connected</span>
        )}
      </div>
      <h3 className="integ-name">{app.name}</h3>
      <p className="integ-desc">{app.desc}</p>
      <button
        type="button"
        className={`btn ${on ? "btn-ghost" : "btn-brand"} btn-sm btn-block integ-action`}
        onClick={() => toast(on ? `${app.name} settings opened` : `Connecting ${app.name}…`)}
      >
        {on ? "Manage" : "Connect"}
      </button>
    </article>
  );
}

export function IntegrationsPage() {
  const [category, setCategory] = useState<string>("");
  const connected = INTEGRATIONS.filter((i) => i.connected).length;

  const header = (
    <div className="page-h">
      <div>
        <h1>Integrations</h1>
        <div className="sub">
          Connect HRIS, identity providers, payments and logistics to automate gifting end-to-end.
        </div>
      </div>
      <div className="integ-summary">
        <span className="integ-summary-stat">
          <b>{connected}</b> connected
        </span>
        <span className="integ-summary-dot">·</span>
        <span className="integ-summary-stat">
          <b>{INTEGRATIONS.length - connected}</b> available
        </span>
      </div>
    </div>
  );

  if (!category) {
    return (
      <>
        {header}
        <div className="integ-cat-grid">
          {INTEG_CATEGORIES.map((cat) => {
            const { total, connected: catConnected } = categoryMeta(cat.key);
            const meta = catConnected
              ? `${catConnected} connected · ${total} integration${total === 1 ? "" : "s"}`
              : `${total} integration${total === 1 ? "" : "s"}`;
            return (
              <button
                key={cat.key}
                type="button"
                className="integ-cat-card"
                onClick={() => setCategory(cat.key)}
              >
                <span className="integ-cat-card-copy">
                  <span className="integ-cat-card-label">{cat.label}</span>
                  <span className="integ-cat-card-desc">{cat.desc}</span>
                  <span className="integ-cat-card-meta">{meta}</span>
                </span>
                <ChevronRight className="integ-cat-chevron" size={18} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </>
    );
  }

  const catDef = INTEG_CATEGORIES.find((c) => c.key === category) ?? { label: category, desc: "" };
  const list = INTEGRATIONS.filter((i) => i.category === category);

  return (
    <>
      {header}
      <div className="integ-detail-h">
        <button
          type="button"
          className="lnk"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
          onClick={() => setCategory("")}
        >
          <ArrowLeft size={15} /> All integrations
        </button>
        <h2>{catDef.label}</h2>
        {catDef.desc && (
          <div className="sub" style={{ marginTop: 6 }}>
            {catDef.desc}
          </div>
        )}
      </div>
      <div className="integ-grid">
        {list.length > 0 ? (
          list.map((app) => <IntegrationCard key={app.id} app={app} />)
        ) : (
          <div className="card empty" style={{ gridColumn: "1/-1", padding: 40 }}>
            <h3>No integrations in this category yet</h3>
          </div>
        )}
      </div>
    </>
  );
}
