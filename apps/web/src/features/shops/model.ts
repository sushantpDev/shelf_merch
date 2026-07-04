import { useMutation } from "@tanstack/react-query";
import { createShopFlow, updateShopFlow } from "@/services/api-bridge";
import { archiveShopApi, duplicateShopApi } from "@/services/workspace-api";
import type { UiShop } from "@/services/mappers";
import { useInvalidateWorkspace } from "@/hooks/useWorkspace";

// Ui types re-exported here so views/controllers never import services/ directly.
export type { UiShop, UiCollection, UiProduct } from "@/services/mappers";

export type CreateShopInput = {
  name: string;
  currency: string;
  categories: string[];
  logoUrl?: string;
  bannerConfig?: Record<string, unknown>;
};

export type UpdateShopInput = {
  name?: string;
  currencyMode?: "points" | "inr" | "priceless";
  pointsConversionEnabled?: boolean;
  logoUrl?: string;
  bannerConfig?: Record<string, unknown>;
  selectedCatalogProductIds?: string[];
};

export function useCreateShop() {
  const invalidate = useInvalidateWorkspace();
  return useMutation({
    mutationFn: (input: CreateShopInput) => createShopFlow(input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateShop() {
  const invalidate = useInvalidateWorkspace();
  return useMutation({
    mutationFn: ({ shopId, input }: { shopId: string; input: UpdateShopInput }) =>
      updateShopFlow(shopId, input),
    onSuccess: () => invalidate(),
  });
}

export function useDuplicateShop() {
  const invalidate = useInvalidateWorkspace();
  return useMutation({
    mutationFn: (shop: UiShop) => duplicateShopApi(shop),
    onSuccess: () => invalidate(),
  });
}

export function useArchiveShop() {
  const invalidate = useInvalidateWorkspace();
  return useMutation({
    mutationFn: (shopId: string) => archiveShopApi(shopId),
    onSuccess: () => invalidate(),
  });
}
