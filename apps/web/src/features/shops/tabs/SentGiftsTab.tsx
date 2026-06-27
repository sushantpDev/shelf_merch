import type { UiShop } from "@/services/mappers";
import sentGiftsEmptyImg from "../../../../assets/sent-gifts-empty.png";

/**
 * Sent gifts are produced by the (not-yet-migrated) Send Points flow and were
 * held in legacy in-memory state. Until Campaigns is migrated this shows the
 * faithful empty state with a hand-off to the legacy send-points flow.
 */
export function SentGiftsTab({ shop, onSendPoints }: { shop: UiShop; onSendPoints: () => void }) {
  return (
    <div className="card sent-gifts-empty">
      <div className="sent-gifts-empty-inner">
        <img src={sentGiftsEmptyImg} alt="" className="sent-gifts-empty-art" />
        <div className="sent-gifts-empty-content">
          <h3>You haven&apos;t sent any points</h3>
          <p className="muted">
            Send points so recipients can redeem in <b>{shop.name}</b>!
          </p>
          <button type="button" className="btn btn-dark btn-lg" onClick={onSendPoints}>
            Send points
          </button>
        </div>
      </div>
    </div>
  );
}
