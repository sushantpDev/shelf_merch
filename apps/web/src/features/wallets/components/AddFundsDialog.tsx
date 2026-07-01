import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, CreditCard, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { inr } from "@/components/platform/platform-ui";
import { parseAmt } from "../types";
import { useFundWallet } from "../hooks";
import {
  CardBrandIcons,
  detectCardBrand,
  formatCardNumber,
} from "./card-brands";

const PRESET_AMOUNTS = [10_000, 25_000, 50_000, 1_00_000, 2_00_000];
const ACH_BONUS_THRESHOLD = 1_00_000;

type PaymentMethod = "card" | "ach";
type CardMode = "saved" | "new";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId: string;
  walletName: string;
};

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

export function AddFundsDialog({ open, onOpenChange, walletId, walletName }: Props) {
  const fund = useFundWallet();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(0);
  const [amountText, setAmountText] = useState("");
  const [note, setNote] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [cardMode, setCardMode] = useState<CardMode>("new");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [country, setCountry] = useState("IN");

  useEffect(() => {
    if (!open) {
      setStep(1);
      setAmount(0);
      setAmountText("");
      setNote("");
      setMethod("card");
      setCardMode("new");
      setCardName("");
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");
      setCountry("IN");
    }
  }, [open]);

  const bonusEligible = method === "ach" && amount >= ACH_BONUS_THRESHOLD;
  const bonusAmount = bonusEligible ? Math.floor(amount * 0.05) : 0;

  const cardDigits = cardNumber.replace(/\D/g, "");
  const cardBrand = detectCardBrand(cardDigits);

  const cardValid =
    cardName.trim().length >= 2 &&
    cardDigits.length >= (cardBrand === "amex" ? 15 : 12) &&
    /^\d{2}\s\/\s\d{2}$/.test(cardExpiry.trim()) &&
    cardCvv.trim().length >= (cardBrand === "amex" ? 4 : 3);

  const canNext =
    (step === 1 && amount > 0) ||
    step === 2 ||
    (step === 3 && method === "ach") ||
    (step === 3 && method === "card" && cardMode === "new" && cardValid);

  function handleAmountChange(raw: string) {
    setAmountText(raw);
    setAmount(parseAmt(raw));
  }

  function selectPreset(value: number) {
    setAmount(value);
    setAmountText(value.toLocaleString("en-IN"));
  }

  async function handleConfirm() {
    const description = [
      method === "card" ? "Card top-up" : "Bank transfer",
      note.trim() || undefined,
      walletName,
    ]
      .filter(Boolean)
      .join(" · ");

    try {
      const totalCredit = amount + bonusAmount;
      await fund.mutateAsync({
        walletId,
        amount: totalCredit,
        description:
          bonusAmount > 0
            ? `${description} (includes ₹${bonusAmount.toLocaleString("en-IN")} bonus)`
            : description,
      });
      toast.success(`₹${totalCredit.toLocaleString("en-IN")} added to ${walletName}`);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add funds");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="add-funds-modal">
        <div className="add-funds-inner">
          <div className="add-funds-scroll">
            <p className="add-funds-eyebrow">Add wallet funds ({step}/4)</p>

          {step === 1 && (
            <div className="add-funds-body">
              <DialogHeader className="add-funds-header">
                <DialogTitle>How much would you like to add?</DialogTitle>
                <DialogDescription>
                  Add ₹1,00,000+ via bank transfer and get up to 5% bonus funds. All funds belong
                  to your workspace and stay available for department campaigns.
                </DialogDescription>
              </DialogHeader>

              <div className="add-funds-field">
                <label className="add-funds-lbl" htmlFor="add-funds-amount">
                  Amount
                </label>
                <div className="add-funds-amount-wrap">
                  <span className="add-funds-currency">₹</span>
                  <input
                    id="add-funds-amount"
                    className="add-funds-amount-input num"
                    inputMode="numeric"
                    placeholder="0"
                    autoFocus
                    value={amountText}
                    onChange={(e) => handleAmountChange(e.target.value)}
                  />
                </div>
                <div className="add-funds-presets">
                  {PRESET_AMOUNTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`add-funds-preset${amount === p ? " on" : ""}`}
                      onClick={() => selectPreset(p)}
                    >
                      ₹{p.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="add-funds-field">
                <label className="add-funds-lbl" htmlFor="add-funds-note">
                  Note
                </label>
                <p className="add-funds-field-hint">Add a reference note for your deposit (optional)</p>
                <input
                  id="add-funds-note"
                  className="add-funds-inp"
                  placeholder='e.g. "Q3 gifting budget"'
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="add-funds-body">
              <DialogHeader className="add-funds-header">
                <DialogTitle>Select your payment method</DialogTitle>
              </DialogHeader>

              <div className="add-funds-methods">
                <button
                  type="button"
                  className={`add-funds-method${method === "card" ? " on" : ""}`}
                  onClick={() => setMethod("card")}
                >
                  <span
                    className={`add-funds-method-radio${method === "card" ? " on" : ""}`}
                    aria-hidden="true"
                  />
                  <div>
                    <div className="add-funds-method-title">Credit card</div>
                    <div className="add-funds-method-sub">Funds are available to use immediately.</div>
                  </div>
                </button>

                <p className="add-funds-bonus-hint">
                  Get 5% extra funds when you add ₹1,00,000+ with:
                </p>

                <button
                  type="button"
                  className={`add-funds-method${method === "ach" ? " on" : ""}`}
                  onClick={() => setMethod("ach")}
                >
                  <span
                    className={`add-funds-method-radio${method === "ach" ? " on" : ""}`}
                    aria-hidden="true"
                  />
                  <div>
                    <div className="add-funds-method-title">Bank transfer</div>
                    <div className="add-funds-method-sub">
                      Send the funds to Shelf Merch — we&apos;ll credit your wallet once the transfer
                      is processed.
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 3 && method === "card" && (
            <div className="add-funds-body">
              <DialogHeader className="add-funds-header">
                <DialogTitle>Pay with credit card</DialogTitle>
                <DialogDescription>How would you like to pay?</DialogDescription>
              </DialogHeader>

              <button type="button" className="add-funds-method add-funds-method-disabled" disabled>
                <span className="add-funds-method-radio" aria-hidden="true" />
                <div>
                  <div className="add-funds-method-title">Use saved card</div>
                  <div className="add-funds-method-sub">You have no saved cards on file.</div>
                </div>
              </button>

              <div className={`add-funds-card-panel${cardMode === "new" ? " on" : ""}`}>
                <button
                  type="button"
                  className="add-funds-card-panel-head"
                  onClick={() => setCardMode("new")}
                >
                  <span className="add-funds-method-radio on" aria-hidden="true" />
                  <span>Add new card</span>
                </button>

                <div className="add-funds-card-form">
                  <div className="add-funds-field">
                    <label className="add-funds-lbl" htmlFor="card-name">
                      Name on card
                    </label>
                    <input
                      id="card-name"
                      className="add-funds-inp"
                      placeholder="Name on card"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                    />
                  </div>

                  <div className="add-funds-field">
                    <div className="add-funds-card-label-row">
                      <CreditCard size={14} className="add-funds-card-icon" />
                      <label className="add-funds-lbl add-funds-lbl-inline" htmlFor="card-number">
                        Card
                      </label>
                    </div>
                    <label className="add-funds-lbl" htmlFor="card-number">
                      Card number
                    </label>
                    <div className="add-funds-card-number-wrap">
                      <input
                        id="card-number"
                        className="add-funds-inp num"
                        placeholder={cardBrand === "amex" ? "3782 822463 10005" : "1234 1234 1234 1234"}
                        inputMode="numeric"
                        value={cardNumber}
                        onChange={(e) => {
                          const brand = detectCardBrand(e.target.value.replace(/\D/g, ""));
                          setCardNumber(formatCardNumber(e.target.value, brand));
                        }}
                      />
                      <CardBrandIcons cardNumber={cardNumber} />
                    </div>
                  </div>

                  <div className="add-funds-card-row">
                    <div className="add-funds-field">
                      <label className="add-funds-lbl" htmlFor="card-expiry">
                        Expiration date
                      </label>
                      <input
                        id="card-expiry"
                        className="add-funds-inp"
                        placeholder="MM / YY"
                        inputMode="numeric"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      />
                    </div>
                    <div className="add-funds-field">
                      <label className="add-funds-lbl" htmlFor="card-cvv">
                        Security code
                      </label>
                      <input
                        id="card-cvv"
                        className="add-funds-inp num"
                        placeholder="CVC"
                        inputMode="numeric"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      />
                    </div>
                  </div>

                  <div className="add-funds-field">
                    <label className="add-funds-lbl" htmlFor="card-country">
                      Country
                    </label>
                    <div className="add-funds-select-wrap">
                      <select
                        id="card-country"
                        className="add-funds-inp add-funds-select"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                      >
                        <option value="IN">India</option>
                        <option value="US">United States</option>
                        <option value="GB">United Kingdom</option>
                        <option value="SG">Singapore</option>
                        <option value="AE">United Arab Emirates</option>
                      </select>
                      <ChevronDown size={16} className="add-funds-select-chevron" aria-hidden />
                    </div>
                  </div>

                  <p className="add-funds-terms">
                    By providing your card information, you allow Shelf Merch to charge your card for
                    future payments in accordance with their terms.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && method === "ach" && (
            <div className="add-funds-body">
              <DialogHeader className="add-funds-header">
                <DialogTitle>Bank transfer details</DialogTitle>
                <DialogDescription>
                  Send {inr(amount)} to the account below. Use your note as the payment reference.
                </DialogDescription>
              </DialogHeader>
              <div className="add-funds-ach-card">
                <div className="add-funds-ach-row">
                  <span>Account name</span>
                  <b>Shelf Merch Pvt Ltd</b>
                </div>
                <div className="add-funds-ach-row">
                  <span>Account number</span>
                  <b>50200012345678</b>
                </div>
                <div className="add-funds-ach-row">
                  <span>IFSC</span>
                  <b>HDFC0001234</b>
                </div>
                <div className="add-funds-ach-row">
                  <span>Reference</span>
                  <b>{note.trim() || walletName}</b>
                </div>
              </div>
              <p className="add-funds-field-hint" style={{ marginTop: 14 }}>
                After you transfer, continue to confirm. We&apos;ll credit your wallet once payment is
                received (usually 1–2 business days).
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="add-funds-body">
              <DialogHeader className="add-funds-header">
                <DialogTitle>Review and confirm</DialogTitle>
                <DialogDescription>Check the details before adding funds to your wallet.</DialogDescription>
              </DialogHeader>
              <div className="add-funds-review">
                <div className="add-funds-review-row">
                  <span>Wallet</span>
                  <b>{walletName}</b>
                </div>
                <div className="add-funds-review-row">
                  <span>Amount</span>
                  <b className="num">{inr(amount)}</b>
                </div>
                {bonusAmount > 0 && (
                  <div className="add-funds-review-row">
                    <span>Bonus (5%)</span>
                    <b className="num add-funds-bonus-val">+{inr(bonusAmount)}</b>
                  </div>
                )}
                <div className="add-funds-review-row">
                  <span>Payment method</span>
                  <b>{method === "card" ? "Credit card" : "Bank transfer"}</b>
                </div>
                {note.trim() && (
                  <div className="add-funds-review-row">
                    <span>Note</span>
                    <b>{note.trim()}</b>
                  </div>
                )}
              </div>
              <div className="add-funds-review-total">
                <Wallet size={18} />
                <span>
                  Total credit: <b className="num">{inr(amount + bonusAmount)}</b>
                </span>
              </div>
            </div>
          )}

          </div>

          <div className="add-funds-foot">
            {step > 1 ? (
              <button
                type="button"
                className="add-funds-back"
                onClick={() => setStep((s) => s - 1)}
                disabled={fund.isPending}
              >
                <ArrowLeft size={15} /> Back
              </button>
            ) : (
              <button type="button" className="add-funds-back" onClick={() => onOpenChange(false)}>
                Cancel
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                className={`add-funds-next${canNext ? " ready" : ""}`}
                disabled={!canNext}
                onClick={() => setStep((s) => s + 1)}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                className="add-funds-next ready"
                disabled={fund.isPending}
                onClick={handleConfirm}
              >
                {fund.isPending ? "Adding…" : "Add funds"}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
