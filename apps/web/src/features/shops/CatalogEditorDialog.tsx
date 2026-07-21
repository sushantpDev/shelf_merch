import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { UiShop } from "@/services/mappers";
import { CatalogEditor } from "./CatalogEditor";
import type { ShopListing } from "./shopListings";

export function CatalogEditorDialog({
  shop,
  listings,
  open,
  onOpenChange,
}: {
  shop: UiShop;
  listings: ShopListing[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm-modal sm-catalog-modal">
        <DialogTitle className="sr-only">Edit catalog</DialogTitle>
        <CatalogEditor shop={shop} listings={listings} />
      </DialogContent>
    </Dialog>
  );
}
