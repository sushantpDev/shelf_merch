import { inr, PlatformError, PlatformModal } from "../../../platform-ui";
import type { FundingActionVm } from "../controllers/useFundingActionController";

/** Funding approve/reject modal. */
export function FundingActionModalView({
  row,
  mode,
  amount,
  reason,
  busy,
  err,
  onClose,
  onAmount,
  onReason,
  onSubmit,
}: FundingActionVm) {
  return (
    <PlatformModal
      title={`${mode === "approve" ? "Approve" : "Reject"} funding`}
      subtitle={`${row.walletName} · ${row.tenantName}`}
      onClose={onClose}
    >
      {err && <PlatformError message={err} />}
      {mode === "approve" ? (
        <div className="field">
          <label className="lbl">Amount to credit (₹)</label>
          <input
            className="inp"
            type="number"
            min={1}
            value={amount || ""}
            onChange={(e) => onAmount(Number(e.target.value))}
          />
          {row.requestedAmount ? (
            <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
              Requested by tenant: {inr(row.requestedAmount)}
              {row.fundingDocument?.docNumber ? ` · ${row.fundingDocument.docNumber}` : ""}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="field">
          <label className="lbl">Rejection reason</label>
          <input
            className="inp"
            value={reason}
            onChange={(e) => onReason(e.target.value)}
            placeholder="e.g. proof of payment not attached"
          />
        </div>
      )}
      <button
        type="button"
        className={mode === "approve" ? "btn btn-brand btn-block" : "btn btn-dark btn-block"}
        disabled={busy}
        onClick={onSubmit}
      >
        {busy ? "Working…" : mode === "approve" ? "Approve funding" : "Reject request"}
      </button>
    </PlatformModal>
  );
}
