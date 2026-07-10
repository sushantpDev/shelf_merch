import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { firePartyBomb } from "@/lib/partyBomb";

/** Post-create shop celebration — welcome modal + full-screen party-popper confetti. */
export function ShopWelcomeDialog({
  open,
  shopName,
  onDone,
}: {
  open: boolean;
  shopName: string;
  onDone: () => void;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      firedRef.current = false;
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;
    firePartyBomb();
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onDone();
      }}
    >
      <DialogContent
        className="sm-shop-welcome"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Welcome to {shopName}</DialogTitle>
        <div className="sm-shop-welcome-body">
          <p className="sm-shop-welcome-kicker">Congratulations</p>
          <h2 className="sm-shop-welcome-heading">Your shop is live!</h2>
          <p className="sm-shop-welcome-copy muted">
            <b>{shopName}</b> is ready. Add branded swag, pick products, and send gifts to your team.
          </p>
          <div className="sm-shop-welcome-actions">
            <button type="button" className="btn btn-dark" onClick={onDone}>
              Done
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
