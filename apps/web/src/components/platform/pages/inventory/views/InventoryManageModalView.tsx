import { PlatformError } from "../../../platform-ui";
import type { InventoryManageVm } from "../controllers/useInventoryManageController";

/** Inventory manage modal: fulfilment mode, threshold, and stock adjustments. */
export function InventoryManageModalView({
  row,
  mode,
  threshold,
  txnType,
  qty,
  reason,
  busy,
  err,
  note,
  onClose,
  onMode,
  onThreshold,
  onTxnType,
  onQty,
  onReason,
  onSaveMode,
  onApplyStock,
}: InventoryManageVm) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.4)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
        padding: 20,
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: 24, maxWidth: 460, width: "100%" }}
      >
        <div
          className="row"
          style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}
        >
          <h3 style={{ fontSize: 18 }}>{row.name}</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="muted" style={{ fontSize: 12, marginBottom: 16 }}>
          {row.sku}
        </p>

        {err && <PlatformError message={err} />}
        {note && (
          <div
            className="card"
            style={{ padding: 10, marginBottom: 12, color: "var(--brand)", fontSize: 13 }}
          >
            {note}
          </div>
        )}

        <div className="field">
          <label className="lbl">Fulfilment mode</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className={mode === "physical" ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"}
              onClick={() => onMode("physical")}
            >
              Physical (track stock)
            </button>
            <button
              type="button"
              className={mode === "made_to_order" ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"}
              onClick={() => onMode("made_to_order")}
            >
              Made to order
            </button>
          </div>
        </div>
        {mode === "physical" && (
          <div className="field">
            <label className="lbl">Low-stock threshold</label>
            <input
              className="inp"
              type="number"
              min={0}
              value={threshold}
              onChange={(e) => onThreshold(Math.max(0, Number(e.target.value)))}
            />
          </div>
        )}
        <button type="button" className="btn btn-soft btn-sm" disabled={busy} onClick={onSaveMode}>
          Save mode & threshold
        </button>

        {mode === "physical" ? (
          <>
            <div className="divider" style={{ margin: "18px 0" }} />
            <label className="lbl">Adjust stock</label>
            <div className="row" style={{ gap: 8, marginBottom: 8 }}>
              {(["add", "reduce", "adjust"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={txnType === t ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"}
                  onClick={() => onTxnType(t)}
                >
                  {t === "add" ? "Restock" : t === "reduce" ? "Remove" : "Correct"}
                </button>
              ))}
            </div>
            <div className="row" style={{ gap: 8 }}>
              <input
                className="inp"
                type="number"
                placeholder="Qty"
                value={qty || ""}
                onChange={(e) => onQty(Number(e.target.value))}
                style={{ width: 100 }}
              />
              <input
                className="inp"
                placeholder="Reason (e.g. PO #1234)"
                value={reason}
                onChange={(e) => onReason(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-brand btn-sm"
              style={{ marginTop: 10 }}
              disabled={busy}
              onClick={onApplyStock}
            >
              Apply stock change
            </button>
          </>
        ) : (
          <p className="muted" style={{ fontSize: 12, marginTop: 14 }}>
            Made-to-order products are produced per order and don't track stock.
          </p>
        )}
      </div>
    </div>
  );
}
