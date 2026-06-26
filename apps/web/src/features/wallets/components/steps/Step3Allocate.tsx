import { toast } from "sonner";
import { inr } from "@/components/platform/platform-ui";
import { amtInput, parseAmt, totalAlloc } from "../../types";
import type { StepProps } from "./StepProps";

function pctLabel(value: number, total: number): string {
  if (!total) return "0%";
  const pct = (value / total) * 100;
  return `${pct.toFixed(pct % 1 ? 1 : 0)}%`;
}

export function Step3Allocate({ state, dispatch }: StepProps) {
  const total = state.wallet.amount;
  const alloc = totalAlloc(state.departments);
  const rem = total - alloc;
  const over = alloc > total;

  const segments = state.departments.filter((d) => d.allocated > 0);

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: 18 }}>Allocate budget across departments</h3>
        <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
          Distribute the wallet across cost centers. Allocations update in real time and can never
          exceed the wallet value.
        </p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 18 }}>
        <div className="card stat">
          <div className="k">Total budget</div>
          <div className="v num">{inr(total)}</div>
        </div>
        <div className="card stat">
          <div className="k">Allocated</div>
          <div className="v num">{inr(alloc)}</div>
        </div>
        <div className="card stat">
          <div className="k">Remaining</div>
          <div className="v num" style={{ color: rem < 0 ? "var(--danger)" : "var(--brand-d)" }}>
            {inr(rem)}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div className="alloc-bar">
          {segments.length === 0 && rem <= 0 ? (
            <div className="alloc-seg gap" style={{ width: "100%" }}>
              Unallocated
            </div>
          ) : (
            <>
              {segments.map((d) => {
                const pct = Math.min((d.allocated / total) * 100, 100);
                return (
                  <div
                    key={d.id}
                    className="alloc-seg"
                    style={{ width: `${pct}%`, background: d.color }}
                  >
                    {pct >= 8 ? `${Math.round((d.allocated / total) * 100)}%` : ""}
                  </div>
                );
              })}
              {rem > 0 && (
                <div className="alloc-seg gap" style={{ width: `${(rem / total) * 100}%` }}>
                  {(rem / total) * 100 >= 8 ? "Unallocated" : ""}
                </div>
              )}
            </>
          )}
        </div>
        <div className="alloc-legend">
          {state.departments.map((d) => (
            <div key={d.id} className="leg">
              <span className="lc" style={{ background: d.color }} />
              {d.name} · {inr(d.allocated)}
            </div>
          ))}
        </div>
      </div>

      <div
        className="row"
        style={{ justifyContent: "flex-end", gap: 10, alignItems: "center", marginTop: 14 }}
      >
        <span className="mut3" style={{ fontSize: 12.5 }}>
          Need a starting point?
        </span>
        <button
          type="button"
          className="btn btn-soft btn-sm"
          onClick={() => {
            dispatch({ type: "splitEven" });
            toast.success("Budget split evenly");
          }}
        >
          Split evenly
        </button>
      </div>

      <table className="alloc-table">
        <thead>
          <tr>
            <th>Department</th>
            <th className="r">Allocated budget</th>
            <th className="r">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {state.departments.map((d) => (
            <tr key={d.id}>
              <td>
                <div className="row" style={{ gap: 8, alignItems: "center" }}>
                  <span
                    className="lc"
                    style={{ width: 10, height: 10, borderRadius: 3, background: d.color }}
                  />
                  {d.name}
                </div>
              </td>
              <td className="r">
                <span style={{ color: "var(--ink-3)", marginRight: 2 }}>₹</span>
                <input
                  className={`alloc-input ${over ? "over" : ""}`}
                  inputMode="numeric"
                  aria-label={`Allocation for ${d.name}`}
                  value={amtInput(d.allocated)}
                  onChange={(e) =>
                    dispatch({ type: "setAlloc", id: d.id, amount: parseAmt(e.target.value) })
                  }
                />
              </td>
              <td className="r">
                <span className="pct-pill">{pctLabel(d.allocated, total)}</span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 700 }}>
            <td style={{ padding: "12px 10px" }}>Total allocated</td>
            <td className="r" style={{ padding: "12px 10px" }}>
              {inr(alloc)}
            </td>
            <td className="r" style={{ padding: "12px 10px" }}>
              {total ? Math.round((alloc / total) * 100) : 0}%
            </td>
          </tr>
        </tfoot>
      </table>

      {over && (
        <div
          className="banner"
          role="alert"
          style={{
            marginTop: 16,
            background: "var(--danger-tint,#fdeceb)",
            color: "var(--danger)",
            border: "none",
          }}
        >
          Allocated amount exceeds the wallet value. Reduce allocations to continue.
        </div>
      )}
    </>
  );
}
