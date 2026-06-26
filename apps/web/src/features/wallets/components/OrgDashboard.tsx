import { Plus, Wallet } from "lucide-react";
import { inr } from "@/components/platform/platform-ui";
import { PageHeader } from "@/components/tenant/PageHeader";
import { fmtDate, totalAlloc, type OrgSnapshot } from "../types";
import { Donut } from "./Donut";

/** Company-admin landing: merchandise wallet overview + departments table. */
export function OrgDashboard({
  account,
  org,
  hasWallets,
  onStart,
  onEdit,
}: {
  account: string;
  org: OrgSnapshot;
  hasWallets: boolean;
  onStart: () => void;
  onEdit: (step: number) => void;
}) {
  if (!org.active && !hasWallets) {
    return (
      <>
        <PageHeader
          title="Wallets"
          subtitle="Set up a merchandise budget, split it into cost centers, and assign managers."
        />
        <div className="card empty" style={{ padding: 50 }}>
          <div className="ic" aria-hidden="true">
            <Wallet size={34} color="#cdd6cf" />
          </div>
          <h3>No merchandise wallet yet</h3>
          <p>
            Create your organization&apos;s merchandise budget wallet to start funding department
            campaigns.
          </p>
          <button
            type="button"
            className="btn btn-brand"
            style={{ marginTop: 16 }}
            onClick={onStart}
          >
            <Plus size={16} /> Create wallet
          </button>
        </div>
      </>
    );
  }

  const o = org.wallet;
  const total = o.amount;
  const alloc = totalAlloc(org.departments);
  const rem = total - alloc;
  const walletLive = o.status === "active";
  const depts = org.departments;
  const invited = depts.filter((d) => d.mgr.invite && d.mgr.email).length;

  return (
    <>
      <PageHeader
        title="Wallets"
        subtitle={`Organization merchandise budget · ${account}`}
        actions={
          <button type="button" className="btn btn-brand" onClick={onStart}>
            <Plus size={16} /> Create wallet
          </button>
        }
      />

      {!walletLive && (
        <div className="banner" style={{ marginBottom: 18 }}>
          <Wallet size={16} aria-hidden="true" />
          <div>
            <b>Wallet setup is not finished.</b> Complete allocation and manager invites, then
            activate from the review step.{" "}
            <span className="lnk" role="button" tabIndex={0} onClick={onStart}>
              Continue setup
            </span>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18, marginBottom: 18 }}>
        <div className="card" style={{ padding: 22 }}>
          <div
            className="row"
            style={{ justifyContent: "space-between", alignItems: "flex-start" }}
          >
            <div>
              <div
                className="mut3"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".04em",
                }}
              >
                Merchandise budget wallet
              </div>
              <h2 style={{ fontSize: 21, fontFamily: "var(--disp)", marginTop: 4 }}>{o.name}</h2>
            </div>
            {walletLive ? (
              <span className="tag tag-live">
                <span className="dot" />
                Active
              </span>
            ) : (
              <span className="tag tag-draft">Setup in progress</span>
            )}
          </div>
          <div
            className="num"
            style={{
              fontFamily: "var(--disp)",
              fontWeight: 800,
              fontSize: 34,
              margin: "14px 0 4px",
            }}
          >
            {inr(total)}
          </div>
          <div className="muted" style={{ fontSize: 13 }}>
            Valid {fmtDate(o.start)} → {fmtDate(o.end)} · Funded via{" "}
            {o.funding === "upload" ? `${o.docType} ${o.docNumber}` : "online payment"}
          </div>
          <div className="row" style={{ gap: 8, marginTop: 16 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(1)}>
              Edit wallet
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(3)}>
              Re-allocate budget
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(4)}>
              Manage managers
            </button>
          </div>
        </div>
        <div className="card" style={{ padding: 22 }}>
          <div
            className="mut3"
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".05em",
              marginBottom: 6,
            }}
          >
            Budget distribution
          </div>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <Donut segments={depts} centerValue={depts.length} centerLabel="Depts" />
            <div style={{ flex: 1 }}>
              {depts.map((d) => (
                <div
                  key={d.id}
                  className="row"
                  style={{ justifyContent: "space-between", padding: "3px 0", fontSize: 12 }}
                >
                  <span className="row" style={{ gap: 6, alignItems: "center" }}>
                    <span
                      className="lc"
                      style={{ width: 9, height: 9, borderRadius: 3, background: d.color }}
                    />
                    {d.name}
                  </span>
                  <b>{total ? Math.round((d.allocated / total) * 100) : 0}%</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card row" style={{ padding: 0, marginBottom: 18 }}>
        <div className="stat" style={{ flex: 1 }}>
          <div className="k">Total budget</div>
          <div className="v num">{inr(total)}</div>
        </div>
        <div style={{ width: 1, background: "var(--line)" }} />
        <div className="stat" style={{ flex: 1 }}>
          <div className="k">Allocated to cost centers</div>
          <div className="v num">{inr(alloc)}</div>
        </div>
        <div style={{ width: 1, background: "var(--line)" }} />
        <div className="stat" style={{ flex: 1 }}>
          <div className="k">Unallocated</div>
          <div className="v num" style={{ color: rem < 0 ? "var(--danger)" : "var(--brand-d)" }}>
            {inr(rem)}
          </div>
        </div>
        <div style={{ width: 1, background: "var(--line)" }} />
        <div className="stat" style={{ flex: 1 }}>
          <div className="k">Managers invited</div>
          <div className="v num">
            {invited} / {depts.length}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 22 }}>
        <div
          className="row"
          style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}
        >
          <h3 style={{ fontSize: 17 }}>Departments (cost centers)</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(2)}>
            <Plus size={15} /> Add / edit departments
          </button>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Department</th>
              <th>Manager</th>
              <th>Role</th>
              <th>Budget</th>
              <th>% of total</th>
              <th>Invite</th>
            </tr>
          </thead>
          <tbody>
            {depts.map((d) => (
              <tr key={d.id}>
                <td>
                  <div className="row" style={{ gap: 9, alignItems: "center" }}>
                    <span
                      className="lc"
                      style={{ width: 11, height: 11, borderRadius: 3, background: d.color }}
                    />
                    <span style={{ fontWeight: 600 }}>{d.name}</span>
                  </div>
                </td>
                <td>
                  {d.mgr.name ? (
                    <>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{d.mgr.name}</div>
                      <div className="mut3" style={{ fontSize: 11 }}>
                        {d.mgr.email || ""}
                      </div>
                    </>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td className="muted" style={{ fontSize: 13 }}>
                  {d.mgr.role || "—"}
                </td>
                <td className="num">{inr(d.allocated)}</td>
                <td className="num">{total ? Math.round((d.allocated / total) * 100) : 0}%</td>
                <td>
                  {d.mgr.invite && d.mgr.email ? (
                    <span className="tag tag-live">
                      <span className="dot" />
                      Invited
                    </span>
                  ) : (
                    <span className="tag tag-draft">Not invited</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
