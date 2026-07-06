import { useShopifyImportController } from "./controllers/useShopifyImportController";
import { ShopifyImportView } from "./views/ShopifyImportView";

/** Route target for catalog and kits Shopify import. */
export function ShopifyImport() {
  const vm = useShopifyImportController();
  return <ShopifyImportView {...vm} />;
}
