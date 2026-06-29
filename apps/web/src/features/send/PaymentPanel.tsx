import { toast } from "sonner";
import { inr } from "@/components/platform/platform-ui";
import type { UiWallet } from "@/services/mappers";
import type { PaymentMethod } from "./types";

/** Shared payment method picker (Send Items + Send Points). */
export function PaymentPanel({
  wallet,
  selected,
  onSelect,
}: {
  wallet: UiWallet | undefined;
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}) {
  const bal = wallet?.balance ?? 0;

  const option = (key: PaymentMethod, title: string, sub: string, extra?: React.ReactNode) => (
    <button
      type="button"
      className={`pay-opt ${selected === key ? "on" : ""}`}
      onClick={() => onSelect(key)}
    >
      <div className="rd" />
      <div style={{ flex: 1, textAlign: "left" }}>
        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{title}</div>
        <div className="mut3" style={{ fontSize: 11.5 }}>
          {sub}
        </div>
      </div>
      {extra}
    </button>
  );

  return (
    <div className="card" style={{ padding: 22 }}>
      <h3 style={{ fontSize: 16, marginBottom: 4 }}>Payment method</h3>
      <p className="muted" style={{ fontSize: 12.5, marginBottom: 16 }}>
        Pay from your wallet balance, or add a new payment method.
      </p>
      {option(
        "wallet",
        `${wallet?.name ?? "Wallet"} balance`,
        `${inr(bal)} available`,
        <span className="tag tag-live">
          <span className="dot" />
          Ready
        </span>,
      )}
      {option("upi", "UPI / Netbanking", "Pay instantly via any UPI app or bank")}
      {option("card", "Debit / credit card", "Visa, Mastercard, RuPay, Amex")}
      {selected === "card" && (
        <>
          <div className="field" style={{ marginTop: 6 }}>
            <input className="inp" placeholder="Name on card" />
          </div>
          <div className="field">
            <input className="inp" placeholder="Card number" />
          </div>
        </>
      )}
      <div className="field" style={{ marginTop: 14 }}>
        <label className="lbl">Billing</label>
        <div
          className="card"
          style={{ padding: "11px 13px", fontSize: 12.5, color: "var(--ink-2)" }}
        >
          Hyderabad, Telangana, IN · GSTIN 36AAAAA0000A1Z5{" "}
          <button
            type="button"
            className="lnk"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            onClick={() => toast("Edit billing in Settings")}
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
