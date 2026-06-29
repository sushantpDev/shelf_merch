import { useMemo } from "react";
import type { SendMode, ScheduleDraft, WhenMode } from "./types";

const LOGO_DECO = (
  <svg viewBox="0 0 48 48" fill="#15784C" width={28} height={28} aria-hidden="true">
    <path
      d="M24 6c2 5 7 8 13 8-3 5-3 11 0 16-6 0-11 3-13 8-2-5-7-8-13-8 3-5 3-11 0-16 6 0 11-3 13-8Z"
      opacity=".9"
    />
    <circle cx="24" cy="24" r="6" fill="#0E5536" />
  </svg>
);

const TZ_OPTIONS = [
  "Asia/Kolkata (IST)",
  "Asia/Dubai (GST)",
  "Europe/London (BST)",
  "America/New_York (EDT)",
  "Asia/Singapore (SGT)",
];

const RAINBOW = "linear-gradient(90deg,#7a3fb0,#2b54d6,#f5d000,#d33b30,#15784c)";

function LogoBanner() {
  return (
    <div
      className="shopbanner dotted"
      style={{ height: 96, borderRadius: 0, display: "grid", placeItems: "center" }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          background: "#fff",
          borderRadius: 10,
          display: "grid",
          placeItems: "center",
        }}
      >
        {LOGO_DECO}
      </div>
    </div>
  );
}

/**
 * Shared recipient-experience step: from/message editor, schedule picker, and
 * live landing-page / email previews. `kind` adapts copy for kit (items) sends;
 * points sends will pass `kind: "points"` when migrated.
 */
export function RecipientExperience({
  shopName = "Rubix",
  mode = "redeem",
  itemCount = 3,
  from,
  message,
  onFrom,
  onMessage,
  when,
  onWhen,
  schedule,
  onSchedule,
  preview,
  onPreview,
}: {
  shopName?: string;
  mode?: SendMode;
  itemCount?: number;
  from: string;
  message: string;
  onFrom: (v: string) => void;
  onMessage: (v: string) => void;
  when: WhenMode;
  onWhen: (v: WhenMode) => void;
  schedule: ScheduleDraft;
  onSchedule: (key: keyof ScheduleDraft, value: string) => void;
  preview: "landing" | "email";
  onPreview: (tab: "landing" | "email") => void;
}) {
  const shipMode = mode !== "redeem"; // surprise / single-location item sends ship directly

  const { track, eta } = useMemo(() => {
    const t = "SM" + (740000000 + Math.floor(Math.random() * 9999999));
    const e = new Date(Date.now() + 5 * 86_400_000).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
    return { track: t, eta: e };
  }, []);

  const headline = shipMode ? `Your gift from ${from} is on its way!` : `${from} sent you a gift!`;
  const cta = shipMode ? "Track your shipment" : "Choose your gift";
  const tab1 = shipMode ? "Tracking page" : "Landing page";
  const tab2 = shipMode ? "Shipping email" : "Invitation email";
  const cap1 = shipMode
    ? "Mobile tracking page recipients open to follow their parcel."
    : "Mobile-first redeem page recipients open from any device.";
  const cap2 = shipMode
    ? "The shipping confirmation that lands in their inbox."
    : "The branded email that lands in their inbox.";
  const msgCaption = shipMode
    ? "included in the shipping email & on the printed card"
    : "shown on landing page & email";

  const shipBlock = (
    <>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "10px 0" }}>
        <span className="tag tag-live">
          <span className="dot" />
          Shipped
        </span>
        <span className="tag tag-draft">ETA {eta}</span>
      </div>
      <div className="mut3" style={{ fontSize: 10, fontWeight: 700 }}>
        TRACKING {track} · {itemCount} item{itemCount > 1 ? "s" : ""}
      </div>
    </>
  );

  const landing = (
    <div className="phone">
      <div className="bar">
        <i />
      </div>
      <LogoBanner />
      <div style={{ padding: 18, textAlign: "center" }}>
        <div
          className="mut3"
          style={{
            fontSize: 9,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          {shipMode ? `A gift from ${from}` : `${from} created a gift for you`}
        </div>
        <h3 style={{ fontSize: 16, margin: "8px 0", lineHeight: 1.25 }}>{headline}</h3>
        {shipMode ? (
          shipBlock
        ) : (
          <p className="muted" style={{ fontSize: 11.5 }}>
            {message}
          </p>
        )}
        {shipMode && (
          <p className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>
            {message}
          </p>
        )}
        {!shipMode && (
          <div style={{ height: 3, borderRadius: 3, margin: "12px 0", background: RAINBOW }} />
        )}
        <div
          className="btn btn-brand btn-block btn-sm"
          style={{ marginTop: shipMode ? 12 : 0, pointerEvents: "none" }}
        >
          {cta}
        </div>
        <div className="mut3" style={{ fontSize: 9, marginTop: 8 }}>
          Powered by Shelf Merch
        </div>
      </div>
    </div>
  );

  const email = (
    <div className="email-frame">
      <div className="topline">
        <i />
        <i />
        <i />
        <span className="mut3" style={{ fontSize: 10, marginLeft: 6 }}>
          inbox · {shopName} {shipMode ? "shipping" : "gift"}
        </span>
      </div>
      <LogoBanner />
      <div style={{ padding: 20, textAlign: "center" }}>
        <div
          className="mut3"
          style={{
            fontSize: 9,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          {shipMode ? `${from} · shipping update` : `${from} sent you something`}
        </div>
        <h3 style={{ fontSize: 17, margin: "8px 0" }}>{headline}</h3>
        {shipMode && shipBlock}
        <div
          style={{
            border: "1px solid var(--line)",
            borderRadius: "var(--r-sm)",
            padding: 14,
            marginTop: 6,
          }}
        >
          <p className="muted" style={{ fontSize: 12 }}>
            {message}
          </p>
          <div style={{ height: 3, borderRadius: 3, margin: "12px 0", background: RAINBOW }} />
          <div className="mut3" style={{ fontSize: 10, fontWeight: 700 }}>
            FROM {(from || "").toUpperCase()}
          </div>
        </div>
        <div
          className="btn btn-dark btn-block btn-sm"
          style={{ marginTop: 12, pointerEvents: "none" }}
        >
          {cta}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Recipient experience</h1>
      <p className="muted" style={{ marginBottom: 18 }}>
        {shipMode
          ? "These gifts ship directly to recipients. Preview the tracking page and shipping email they receive."
          : "Craft the message and see exactly what recipients get — on the landing page and in their invitation email."}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 28 }}>
        <div>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>Your message</h3>
            <div className="field">
              <label className="lbl">From</label>
              <input className="inp" value={from} onChange={(e) => onFrom(e.target.value)} />
            </div>
            <div className="field">
              <label className="lbl">
                Message{" "}
                <span
                  className="mut3"
                  style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}
                >
                  {msgCaption}
                </span>
              </label>
              <textarea
                className="inp"
                rows={4}
                value={message}
                onChange={(e) => onMessage(e.target.value)}
              />
            </div>
          </div>

          <div className="card" style={{ padding: 20, marginTop: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>When should we send?</h3>
            <button
              type="button"
              className={`optcard ${when === "now" ? "on" : ""}`}
              onClick={() => onWhen("now")}
            >
              <div className="rd" />
              <div>
                <h4>{shipMode ? "Ship immediately after payment" : "Immediately after payment"}</h4>
              </div>
            </button>
            <button
              type="button"
              className={`optcard ${when === "sched" ? "on" : ""}`}
              style={{ marginTop: 10 }}
              onClick={() => onWhen("sched")}
            >
              <div className="rd" />
              <div>
                <h4>Schedule for later</h4>
                <p>Pick a date, time &amp; time zone</p>
              </div>
            </button>
            {when === "sched" && (
              <div className="sched-grid">
                <div>
                  <label className="lbl">Date</label>
                  <input
                    type="date"
                    className="inp"
                    value={schedule.date}
                    onChange={(e) => onSchedule("date", e.target.value)}
                  />
                </div>
                <div>
                  <label className="lbl">Time</label>
                  <input
                    type="time"
                    className="inp"
                    value={schedule.time}
                    onChange={(e) => onSchedule("time", e.target.value)}
                  />
                </div>
                <div>
                  <label className="lbl">Time zone</label>
                  <select
                    className="inp"
                    value={schedule.tz}
                    onChange={(e) => onSchedule("tz", e.target.value)}
                  >
                    {TZ_OPTIONS.map((z) => (
                      <option key={z}>{z}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            {!shipMode && (
              <button
                type="button"
                className={`optcard ${when === "self" ? "on" : ""}`}
                style={{ marginTop: 10 }}
                onClick={() => onWhen("self")}
              >
                <div className="rd" />
                <div>
                  <h4>I'll share the invite link myself</h4>
                </div>
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="row" style={{ justifyContent: "center", marginBottom: 16 }}>
            <div className="prevtabs">
              <button
                type="button"
                className={preview === "landing" ? "on" : ""}
                onClick={() => onPreview("landing")}
              >
                {tab1}
              </button>
              <button
                type="button"
                className={preview === "email" ? "on" : ""}
                onClick={() => onPreview("email")}
              >
                {tab2}
              </button>
            </div>
          </div>
          {preview === "landing" ? (
            <div style={{ maxWidth: 300, margin: "0 auto" }}>{landing}</div>
          ) : (
            <div style={{ maxWidth: 440, margin: "0 auto" }}>{email}</div>
          )}
          <p className="mut3" style={{ textAlign: "center", fontSize: 11.5, marginTop: 14 }}>
            {preview === "landing" ? cap1 : cap2}
          </p>
        </div>
      </div>
    </>
  );
}
