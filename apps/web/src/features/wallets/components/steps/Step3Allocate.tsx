import { toast } from "sonner";
import { inr } from "@/components/platform/platform-ui";
import { amtInput, parseAmt, pctOfWalletTotal, remainingWalletBalanceForWizard, selectedDepartments, wizardCommittedAllocations } from "../../types";
import type { StepProps } from "./StepProps";

function pctLabel(value: number, total: number): string {
  if (!total) return "0%";
  const pct = (value / total) * 100;
  return `${pct.toFixed(pct % 1 ? 1 : 0)}%`;
}

export function Step3Allocate({ state, dispatch }: StepProps) {
  const total = state.wallet.amount;
  const depts = selectedDepartments(state.departments);
  const alloc = wizardCommittedAllocations(state.departments, state.mode);
  const rem = remainingWalletBalanceForWizard(total, state.departments, state.mode);
  const over = alloc > total;

  const segments = depts.filter((d) => d.allocated > 0);

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
          {depts.map((d) => (
            <div key={d.id} className="leg">
              <span className="lc" style={{ background: d.color }} />
              {d.name} · {inr(d.allocated)}
            </div>
          ))}
        </div>
      </div>

      <div className="card alloc-panel">
        <div className="alloc-panel-head">
          <div>
            <div className="alloc-panel-title">Department allocations</div>
            <div className="alloc-panel-sub">Set an amount for each selected department</div>
          </div>
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

        <div className="alloc-list">
          {depts.map((d) => {
            const pct = pctLabel(d.allocated, total);
            const rowOver = over && d.allocated > 0;
            return (
              <div key={d.id} className="alloc-row">
                <div className="alloc-row-dept">
                  <div className="alloc-row-swatch" style={{ background: d.color }}>
                    {d.name.charAt(0)}
                  </div>
                  <span className="alloc-row-name">{d.name}</span>
                </div>
                <div className="alloc-row-controls">
                  <div className={`alloc-money${rowOver ? " alloc-money--over" : ""}`}>
                    <span className="alloc-money-prefix">₹</span>
                    <input
                      className="alloc-money-input"
                      inputMode="numeric"
                      aria-label={`Allocation for ${d.name}`}
                      value={amtInput(d.allocated)}
                      onChange={(e) =>
                        dispatch({ type: "setAlloc", id: d.id, amount: parseAmt(e.target.value) })
                      }
                    />
                  </div>
                  <span className={`alloc-pct${d.allocated > 0 ? " alloc-pct--on" : ""}`}>{pct}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className={`alloc-total${over ? " alloc-total--over" : ""}`}>
          <span className="alloc-total-label">Total allocated</span>
          <span className="alloc-total-amt num">{inr(alloc)}</span>
          <span className="alloc-total-pct">{pctOfWalletTotal(alloc, total)}</span>
        </div>
      </div>

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
