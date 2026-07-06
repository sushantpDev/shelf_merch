import { ArrowLeft, ArrowRight, Box, Coins, Plus, Store } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ShopBanner } from "@/features/shops/banner";
import type { SendGiftVm } from "../controllers/useCampaignsController";

/** "Send Gift" chooser: pick points or a kit, then shop / kit to send. */
export function SendGiftDialogView({
  open,
  view,
  availableKits,
  availableShops,
  onOpenChange,
  onPickKitView,
  onStartSendPoints,
  onSelectShopForPoints,
  onBackToChoose,
  onSelectKit,
  onCreateKit,
  onCreateShop,
  canCreateKit,
  canCreateShop,
}: SendGiftVm) {
  const modalWidth = view === "choose" ? 600 : 640;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm-modal send-gift-modal" style={{ maxWidth: modalWidth }}>
        {view === "choose" ? (
          <>
            <div className="send-gift-header">
              <div className="eyebrow">Send a gift</div>
              <DialogTitle className="send-gift-title">What would you like to send?</DialogTitle>
              <p className="send-gift-desc">
                Choose how you&apos;d like to delight your people. You can fine-tune recipients and
                branding on the next step.
              </p>
            </div>

            <div className="send-gift-options">
              <button type="button" className="send-gift-option" onClick={onStartSendPoints}>
                <div className="send-gift-option-icon" aria-hidden="true">
                  <Coins size={22} strokeWidth={2} />
                </div>
                <div className="send-gift-option-body">
                  <h4>Send points</h4>
                  <p>Let recipients pick their own swag from your branded shop.</p>
                </div>
                <ArrowRight size={18} className="send-gift-option-arrow" aria-hidden="true" />
              </button>

              <button type="button" className="send-gift-option" onClick={onPickKitView}>
                <div className="send-gift-option-icon" aria-hidden="true">
                  <Box size={22} strokeWidth={2} />
                </div>
                <div className="send-gift-option-body">
                  <h4>Send a kit</h4>
                  <p>Ship a ready-made bundle of branded items to addresses.</p>
                </div>
                <ArrowRight size={18} className="send-gift-option-arrow" aria-hidden="true" />
              </button>
            </div>
          </>
        ) : view === "points" ? (
          <>
            <button type="button" className="send-gift-back" onClick={onBackToChoose}>
              <ArrowLeft size={15} />
              Back
            </button>

            <div className="send-gift-header">
              <div className="eyebrow">Send points</div>
              <DialogTitle className="send-gift-title">Choose a shop</DialogTitle>
              <p className="send-gift-desc">
                Recipients redeem points from the shop you select. Pick the storefront they should
                browse and order from.
              </p>
            </div>

            <div className="send-gift-kit-list">
              {availableShops.length > 0 ? (
                availableShops.map((shop) => (
                  <div key={shop.id} className="send-gift-shop-row">
                    <div className="send-gift-shop-thumb">
                      <ShopBanner source={shop} height={52} layout="center" logoSize={28} radius={8} />
                    </div>
                    <div className="send-gift-kit-meta">
                      <div className="send-gift-kit-name">{shop.name}</div>
                      <div className="send-gift-kit-sub">
                        {shop.currency}
                        {shop.live ? (
                          <>
                            {" "}
                            · <span className="send-gift-shop-live">Live</span>
                          </>
                        ) : (
                          " · Draft"
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-brand btn-sm"
                      onClick={() => onSelectShopForPoints(shop.id)}
                    >
                      Select
                    </button>
                  </div>
                ))
              ) : (
                <div className="send-gift-kit-empty">
                  <h3>No shops yet</h3>
                  <p>Create a shop before sending points.</p>
                </div>
              )}
            </div>

            {availableShops.length === 0 && canCreateShop ? (
              <button
                type="button"
                className="btn btn-brand btn-block send-gift-create-kit"
                onClick={onCreateShop}
              >
                <Store size={16} /> Create a shop
              </button>
            ) : null}
          </>
        ) : (
          <>
            <button type="button" className="send-gift-back" onClick={onBackToChoose}>
              <ArrowLeft size={15} />
              Back
            </button>

            <div className="send-gift-header">
              <div className="eyebrow">Send a kit</div>
              <DialogTitle className="send-gift-title">Choose a kit to send</DialogTitle>
              <p className="send-gift-desc">
                Select one of your existing kits, or create a new kit.
              </p>
            </div>

            <div className="send-gift-kit-list">
              {availableKits.length > 0 ? (
                availableKits.map((k) => (
                  <div key={k.id} className="send-gift-kit-row">
                    <div className="send-gift-option-icon" aria-hidden="true">
                      <Box size={20} strokeWidth={2} />
                    </div>
                    <div className="send-gift-kit-meta">
                      <div className="send-gift-kit-name">{k.name}</div>
                      <div className="send-gift-kit-sub">
                        {k.items} item{k.items === 1 ? "" : "s"} · {k.status}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-brand btn-sm"
                      onClick={() => onSelectKit(k.id)}
                    >
                      Select
                    </button>
                  </div>
                ))
              ) : (
                <div className="send-gift-kit-empty">
                  <h3>No kits available</h3>
                  <p>Create a kit before starting this send.</p>
                </div>
              )}
            </div>

            {canCreateKit ? (
              <button
                type="button"
                className="btn btn-soft btn-block send-gift-create-kit"
                onClick={onCreateKit}
              >
                <Plus size={16} /> Create a new kit
              </button>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
