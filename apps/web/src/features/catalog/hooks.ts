import { useQuery } from "@tanstack/react-query";
import { refreshCatalogProducts, type CatalogProductsResult } from "@/services/api-bridge";
import { ALL_PRODUCTS } from "./types";

export const CATALOG_QUERY_KEY = "catalog";

/**
 * Catalog products for a category. Mirrors the legacy server-side filtering
 * (`refreshCatalogProducts`), cached per category. The "All Products" tab is
 * seeded from the workspace snapshot to avoid a load flash on first paint.
 */
export function useCatalog(category: string, seed?: CatalogProductsResult) {
  return useQuery({
    queryKey: [CATALOG_QUERY_KEY, category],
    queryFn: () => refreshCatalogProducts(category === ALL_PRODUCTS ? undefined : category),
    initialData: category === ALL_PRODUCTS ? seed : undefined,
    staleTime: 30_000,
  });
}
