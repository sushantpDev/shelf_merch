import { CircleDollarSign, Plus } from "lucide-react";

type Props = {
  onSetup: () => void;
  disabled?: boolean;
};

/** First-time empty state — matches the legacy card.empty layout. */
export function EmptyBudgetState({ onSetup, disabled }: Props) {
  return (
    <div className="card empty" style={{ padding: 50 }}>
      <div className="ic" aria-hidden="true">
        <CircleDollarSign size={34} color="var(--gray-300)" />
      </div>
      <h3>Organization budget</h3>
      <p>
        Create your merchandise budget by submitting a Purchase Order or Agreement. ShelfMerch will
        review your funding request before your budget goes live.
      </p>
      <button
        type="button"
        className="btn btn-brand"
        style={{ marginTop: 16 }}
        onClick={onSetup}
        disabled={disabled}
      >
        <Plus size={16} /> Setup budget
      </button>
    </div>
  );
}
