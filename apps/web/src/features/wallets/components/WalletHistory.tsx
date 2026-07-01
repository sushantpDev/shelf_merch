import { Wallet } from "lucide-react";
import { inr } from "@/components/platform/platform-ui";
import { useWalletTransactions } from "../hooks";

function formatTxnDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function txnLabel(type: string): string {
  if (type === "fund_in") return "Funds added";
  if (type === "allocation_to_entity") return "Budget allocated";
  if (type === "transfer_between_wallets") return "Transfer";
  if (type === "campaign_spend" || type === "order_payment") return "Spend";
  if (type === "refund") return "Refund";
  return type.replace(/_/g, " ");
}

export function WalletHistory({ walletId }: { walletId: string }) {
  const { data: txns = [], isLoading } = useWalletTransactions(walletId);

  return (
    <div className="card data-list-card wallet-history">
      <div className="data-list-title">Wallet history</div>

      {isLoading && <p className="muted" style={{ fontSize: 13 }}>Loading transactions…</p>}

      {!isLoading && txns.length === 0 && (
        <div className="data-list-empty">
          <div className="data-list-empty-icon" aria-hidden="true">
            <Wallet size={28} color="var(--brand)" />
          </div>
          <h4>No wallet history yet</h4>
          <p className="muted" style={{ fontSize: 13, maxWidth: 360, margin: "0 auto" }}>
            Preload now for future campaigns. Add ₹1,00,000+ via bank transfer and get 5% bonus
            funds.
          </p>
        </div>
      )}

      {!isLoading && txns.length > 0 && (
        <table className="tbl data-list-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {txns.map((t) => (
              <tr key={t._id ?? `${t.createdAt}-${t.amount}`}>
                <td className="muted data-list-cell">{formatTxnDate(t.createdAt)}</td>
                <td className="data-list-cell">{t.description || "—"}</td>
                <td className="muted data-list-cell">{txnLabel(t.type)}</td>
                <td
                  className="num data-list-cell data-list-amount"
                  style={{ color: t.amount >= 0 ? "var(--brand-d)" : "var(--ink)" }}
                >
                  {t.amount >= 0 ? "+" : ""}
                  {inr(Math.abs(t.amount))}
                </td>
                <td className="num muted data-list-cell">
                  {t.balanceAfter != null ? inr(t.balanceAfter) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
