import { KitPreviewDialog } from "./KitPreviewDialog";
import { usePreDesignedKitsController } from "./controllers/usePreDesignedKitsController";
import { PreDesignedKitsView } from "./views/PreDesignedKits";

/** Thin binding for the pre-designed kits widget. */
export function PreDesignedKits() {
  const vm = usePreDesignedKitsController();
  return (
    <>
      <PreDesignedKitsView {...vm} />
      <KitPreviewDialog
        open={!!vm.kitPreview}
        onOpenChange={vm.onPreviewOpenChange}
        data={vm.kitPreview}
      />
    </>
  );
}
