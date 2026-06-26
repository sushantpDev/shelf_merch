import { inr } from "@/components/platform/platform-ui";
import { fmtDate } from "../../types";
import { Donut } from "../Donut";
import type { StepProps } from "./StepProps";

export function Step5Review({ state, dispatch, account }: StepProps & { account: string }) {
  const o = state.wallet;
  const total = o.amount;
  const depts = state.departments;

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: 18 }}>Review organization setup</h3>
        <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
          Confirm everything looks right. Jump back to any step to make changes before finishing.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <b style={{ fontSize: 14 }}>Organization &amp; wallet</b>
              <span
                className="lnk"
                role="button"
                tabIndex={0}
                onClick={() => dispatch({ type: "goto", step: 1 })}
              >
                Edit
              </span>
            </div>
            <ReviewRow label="Organization" value={account} />
            <ReviewRow label="Wallet" value={o.name} />
            <ReviewRow label="Total budget" value={inr(total)} accent last={false} />
            <ReviewRow label="Validity" value={`${fmtDate(o.start)} → ${fmtDate(o.end)}`} last />
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
              <b style={{ fontSize: 14 }}>Departments &amp; managers</b>
              <span
                className="lnk"
                role="button"
                tabIndex={0}
                onClick={() => dispatch({ type: "goto", step: 2 })}
              >
                Edit
              </span>
            </div>
            {depts.map((d) => (
              <div key={d.id} className="rev-dept">
                <span className="sw" style={{ background: d.color }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{d.name}</div>
                  <div className="mut3" style={{ fontSize: 11.5 }}>
                    {d.mgr.name
                      ? `${d.mgr.name}${d.mgr.email ? ` · ${d.mgr.email}` : ""}`
                      : "No manager assigned"}
                  </div>
                </div>
                <span className="num" style={{ fontWeight: 700, fontSize: 13 }}>
                  {inr(d.allocated)}
                </span>
                <span className="pct-pill">
                  {total ? Math.round((d.allocated / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <aside className="card" style={{ padding: 20 }}>
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
          <Donut
            segments={depts}
            centerValue={depts.length}
            centerLabel="Departments"
            centerFontSize={26}
          />
          <div style={{ marginTop: 6 }}>
            {depts.map((d) => (
              <div
                key={d.id}
                className="row"
                style={{ justifyContent: "space-between", padding: "5px 0", fontSize: 12.5 }}
              >
                <span className="row" style={{ gap: 7, alignItems: "center" }}>
                  <span
                    className="lc"
                    style={{ width: 10, height: 10, borderRadius: 3, background: d.color }}
                  />
                  {d.name}
                </span>
                <b>{total ? Math.round((d.allocated / total) * 100) : 0}%</b>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}

function ReviewRow({
  label,
  value,
  accent,
  last,
}: {
  label: string;
  value: string;
  accent?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className="row"
      style={{
        justifyContent: "space-between",
        padding: "7px 0",
        borderBottom: last ? "none" : "1px solid var(--line)",
      }}
    >
      <span className="muted" style={{ fontSize: 13 }}>
        {label}
      </span>
      <span
        style={{
          fontWeight: accent ? 700 : 600,
          fontSize: 13,
          color: accent ? "var(--brand-d)" : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}
