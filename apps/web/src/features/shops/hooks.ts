import { useMutation } from "@tanstack/react-query";
import { createShopFlow, updateShopFlow } from "@/services/api-bridge";
import { useInvalidateWorkspace } from "@/hooks/useWorkspace";

export type CreateShopInput = {
  name: string;
  currency: string;
  categories: string[];
  logoUrl?: string;
  bannerConfig?: Record<string, unknown>;
};

export type UpdateShopInput = {
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
