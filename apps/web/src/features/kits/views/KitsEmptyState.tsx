import { type ComponentType, type ReactNode } from "react";
import { Link } from "react-router";
import { BookOpen, Package, Radio, Send, UserPlus, Users } from "lucide-react";
import { PreDesignedKits } from "../PreDesignedKits";
import kitsAndItemsImg from "../../../../assets/kits.png";
import noKitsYetImg from "../../../../assets/no-kits-yet.png";

const ICON_CHIP: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  background: "#EAF5EF",
  display: "grid",
  placeItems: "center",
  color: "var(--brand)",
};

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  hint: string;
  icon: ComponentType<{ size?: number }>;
}) {
  return (
    <div
      className="card stat"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "12px 16px",
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <span className="k" style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}>
            {label}
          </span>
          <div style={ICON_CHIP}>
            <Icon size={16} />
          </div>
        </div>
        <div
          className="v num"
          style={{
            fontFamily: "var(--disp)",
            fontWeight: 800,
            fontSize: 26,
            lineHeight: 1.1,
            color: "var(--ink)",
          }}
        >
          {value}
        </div>
      </div>
      <div className="mut3" style={{ fontSize: 11 }}>
        {hint}
      </div>
    </div>
  );
}

function FlowStep({
  n,
  icon: Icon,
  title,
  desc,
}: {
  n: number;
  icon: ComponentType<{ size?: number }>;
  title: string;
  desc: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "#EAF5EF",
          color: "var(--brand)",
          display: "grid",
          placeItems: "center",
          fontWeight: 700,
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {n}
      </div>
      <div style={{ color: "var(--brand)", flexShrink: 0, display: "grid", placeItems: "center" }}>
        <Icon size={22} />
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", marginBottom: 2 }}>
          {title}
        </div>
        <div className="muted" style={{ fontSize: 12, lineHeight: 1.35 }}>
          {desc}
        </div>
      </div>
    </div>
  );
}

type KitsEmptyStateProps = {
  /** Workspace contacts available to send kits to. */
  contactCount?: number;
  canCreateKits?: boolean;
};

export function KitsEmptyState({ contactCount = 0, canCreateKits = true }: KitsEmptyStateProps) {
  return (
    <>
      <div
        className="grid"
        style={{
          // gridTemplateColumns: "3.3fr 1.7fr",
          gap: 16,
          marginBottom: 24,
          alignItems: "stretch",
        }}
      >
        <div
          className="card"
          style={{
            padding: 32,
            display: "flex",
            alignItems: "stretch",
            justifyContent: "space-between",
            background: "#fff",
          }}
        >
          <div
            style={{
              flex: 1.2,
              paddingRight: 12,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <h1
              style={{
                fontSize: "clamp(32px,6vw,45px)",
                fontWeight: 700,
                marginBottom: 10,
                fontFamily: "var(--disp)",
                lineHeight: 1.3,
                color: "var(--ink)",
              }}
            >
              Kits &amp; Items
            </h1>
            <p
              className="muted"
              style={{ fontSize: 15.5, lineHeight: 1.7, marginBottom: 20, maxWidth: 400 }}
            >
              Bundle catalog products into reusable kits and send them to employees at scale for any
              occasion.
            </p>
            <div className="row" style={{ gap: 12 }}>
              {canCreateKits ? (
                <Link to="/app/kits/new" className="btn btn-brand">
                  Create your first kit
                </Link>
              ) : null}
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() =>
                  document
                    .getElementById("pre-designed-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                View sample kits
              </button>
            </div>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              minHeight: 300,
            }}
          >
            <img
              src={kitsAndItemsImg}
              alt="Kits and Items"
              style={{ maxHeight: 300, maxWidth: "100%", objectFit: "contain" }}
            />
          </div>
        </div>

        {/* <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: 16,
          }}
        >
          <StatCard label="Total kits" value="0" hint="All created kits" icon={Package} />
          <StatCard label="Live kits" value="0" hint="Active and sending" icon={Radio} />
          <StatCard label="Kits sent" value="0" hint="Total sent" icon={Send} />
          <StatCard label="Recipients reached" value="45" hint="Across all kits" icon={Users} />
        </div> */}
      </div>

      <div
        className="card"
        style={{
          padding: "18px 28px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#fff",
        }}
      >
        <FlowStep
          n={1}
          icon={Package}
          title="Create a kit"
          desc="Choose products from the catalog and name your kit."
        />
        <div style={{ color: "var(--line)", fontSize: 22, fontWeight: 300, padding: "0 24px" }}>
          ›
        </div>
        <FlowStep
          n={2}
          icon={Users}
          title="Add recipients"
          desc="Select employees or import contacts to receive the kit."
        />
        <div style={{ color: "var(--line)", fontSize: 22, fontWeight: 300, padding: "0 24px" }}>
          ›
        </div>
        <FlowStep
          n={3}
          icon={Send}
          title="Send & track"
          desc="Launch your kit and monitor delivery status in real time."
        />
      </div>

      <div
        className="grid"
        style={{ gridTemplateColumns: "1fr 1.25fr", gap: 20, alignItems: "stretch" }}
      >
        <div
          className="card"
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "#fff",
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 16 }}>
            Create from scratch
          </h3>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "24px 0",
            }}
          >
            <img
              src={noKitsYetImg}
              alt="No kits yet"
              style={{ maxHeight: 230, marginBottom: 18, objectFit: "contain" }}
            />
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>
              No kits yet
            </div>
            <p
              className="muted"
              style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 20, maxWidth: 300 }}
            >
              Looks like you haven&apos;t created any kits yet. Create your first kit to get
              started.
            </p>
            <Link to="/app/kits/new" className="btn btn-brand" style={{ marginBottom: 16 }}>
              Create your first kit
            </Link>
            <div className="row" style={{ gap: 16, fontSize: 13, fontWeight: 600 }}>
              <Link
                to="/app/contacts"
                className="lnk"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <UserPlus size={14} /> Import recipients
              </Link>
              <span
                className="lnk"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <BookOpen size={14} /> Read guide
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: 16,
          }}
        >
          <StatCard label="Total kits" value="0" hint="All created kits" icon={Package} />
          <StatCard label="Live kits" value="0" hint="Active and sending" icon={Radio} />
          <StatCard label="Kits sent" value="0" hint="Total sent" icon={Send} />
          <StatCard
            label="Recipients reached"
            value={String(contactCount)}
            hint={contactCount === 1 ? "Contact in workspace" : "Contacts in workspace"}
            icon={Users}
          />
        </div>
      </div>

      <div
        id="pre-designed-section"
        className="card"
        style={{ marginTop: 24, padding: 24, background: "#fff" }}
      >
        <div
          className="row"
          style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}
        >
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 3 }}>
              Pre-designed kits
            </h3>
            <div className="muted" style={{ fontSize: 12 }}>
              Choose a ready-made template and customize it.
            </div>
          </div>
        </div>
        <PreDesignedKits />
      </div>
    </>
  );
}
