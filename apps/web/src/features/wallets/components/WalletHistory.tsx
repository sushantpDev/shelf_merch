import { Wallet } from "lucide-react";
import { inr } from "@/components/platform/platform-ui";
import { useWalletTransactions } from "../hooks";
import type { WalletTransactionRow } from "@/services/mutations-api";

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

/** Running unallocated balance (cash − earmarked to departments) after each row. */
function withAvailableBalance(txns: WalletTransactionRow[]) {
  const chronological = [...txns].sort(
    (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
  );
  let allocated = 0;
  const availableByKey = new Map<string, number>();

  for (const t of chronological) {
    if (t.type === "allocation_to_entity") {
      allocated += t.amount;
    } else if (t.type === "campaign_spend" || t.type === "order_payment") {
      allocated += t.amount;
    }
    const cash = t.balanceAfter ?? 0;
    const key = t._id ?? `${t.createdAt}-${t.amount}-${t.type}`;
    availableByKey.set(key, cash - allocated);
  }

  return txns.map((t) => {
    const key = t._id ?? `${t.createdAt}-${t.amount}-${t.type}`;
    return { ...t, availableAfter: availableByKey.get(key) };
  });
}

function txnAmountDisplay(t: WalletTransactionRow): { text: string; color: string } {
  if (t.type === "allocation_to_entity") {
    return { text: `-${inr(t.amount)}`, color: "var(--danger)" };
  }
  return {
    text: `${t.amount >= 0 ? "+" : ""}${inr(Math.abs(t.amount))}`,
    color: t.amount >= 0 ? "var(--brand-d)" : "var(--ink)",
  };
}

export function WalletHistory({ walletId }: { walletId: string }) {
  const { data: txns = [], isLoading } = useWalletTransactions(walletId);
  const rows = withAvailableBalance(txns);

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
              <th>Available balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const amount = txnAmountDisplay(t);
              return (
              <tr key={t._id ?? `${t.createdAt}-${t.amount}`}>
                <td className="muted data-list-cell">{formatTxnDate(t.createdAt)}</td>
                <td className="data-list-cell">{t.description || "—"}</td>
                <td className="muted data-list-cell">{txnLabel(t.type)}</td>
                <td
                  className="num data-list-cell data-list-amount"
                  style={{ color: amount.color }}
                >
                  {amount.text}
                </td>
                <td className="num muted data-list-cell">
                  {t.availableAfter != null ? inr(t.availableAfter) : "—"}
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
