import { Wallet } from "lucide-react";
import { inr } from "@/components/platform/platform-ui";
import { PageHeader } from "@/components/tenant/PageHeader";
import type { OrgSnapshot } from "../types";

/** Department-budget view shown to an entity (department) manager. */
export function EntityManagerDashboard({
  account,
  org,
  primaryEntityId,
}: {
  account: string;
  org: OrgSnapshot;
  primaryEntityId?: string;
}) {
  const dept =
    (primaryEntityId && org.departments.find((d) => String(d.id) === String(primaryEntityId))) ||
    org.departments[0];

  if (!dept) {
    return (
      <>
        <PageHeader title="My department budget" subtitle={account} />
        <div className="card empty" style={{ padding: 50 }}>
          <div className="ic" aria-hidden="true">
            <Wallet size={34} color="#cdd6cf" />
          </div>
          <h3>Budget not available yet</h3>
          <p>
            Your company admin must finish <b>wallet allocation</b> (departments, budget split, and
            manager invites) before you can launch campaigns. If you were invited by email, accept
            the invite link first.
          </p>
        </div>
      </>
    );
  }

  const alloc = dept.allocated || 0;
  const spent = dept.spent || 0;
  const rem = alloc - spent;

  return (
    <>
      <PageHeader title="My department budget" subtitle={`${account} · ${dept.name}`} />

      {!alloc && (
        <div
          className="banner"
          style={{
            marginBottom: 18,
            background: "var(--warn-tint,#fff8e6)",
            color: "var(--ink-2)",
            border: "none",
          }}
        >
          <b>Budget not allocated yet.</b> Your admin assigned you as manager, but the department
          budget has not been saved. Ask them to open <b>Wallets → Re-allocate budget</b> and finish
          setup.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 18,
          marginBottom: 18,
        }}
      >
        <div className="card" style={{ padding: 22 }}>
          <div
            className="mut3"
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".04em",
            }}
          >
            Allocated to you
          </div>
          <div
            className="num"
            style={{
              fontFamily: "var(--disp)",
              fontWeight: 800,
              fontSize: 34,
              margin: "12px 0 4px",
            }}
          >
            {inr(alloc)}
          </div>
          <div className="muted" style={{ fontSize: 13 }}>
            This is your department&apos;s merchandise budget for campaigns and orders.
          </div>
        </div>
        <div className="card row" style={{ padding: 0 }}>
          <div className="stat" style={{ flex: 1 }}>
            <div className="k">Spent</div>
            <div className="v num">{inr(spent)}</div>
          </div>
          <div style={{ width: 1, background: "var(--line)" }} />
          <div className="stat" style={{ flex: 1 }}>
            <div className="k">Remaining</div>
            <div className="v num" style={{ color: "var(--brand-d)" }}>
              {inr(rem)}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: "18px 22px" }}>
        <div className="mut3" style={{ fontSize: 12 }}>
          You can create campaigns and send gifts from this budget. Company-wide wallet settings are
          managed by your admin.
        </div>
      </div>
    </>
  );
}
