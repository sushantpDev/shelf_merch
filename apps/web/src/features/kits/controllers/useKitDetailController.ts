import { useMemo } from "react";
import { useParams } from "react-router";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { UiKit, UiProduct } from "../model";

export type KitDetailProduct = { name: string; brand?: string; img?: UiProduct };

export type KitDetailVm = {
  isLoading: boolean;
  errorMessage: string | null;
  kit: UiKit | undefined;
  products: KitDetailProduct[];
  canEditKit: boolean;
  canSendKit: boolean;
};

/** Controller for the kit detail page: route param, kit lookup, product refs. */
export function useKitDetailController(): KitDetailVm {
  const { id } = useParams() as { id: string };
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const { canWrite, canOperateCampaigns } = useTenantAccess();
  const kit = workspace?.kits.find((k) => k.id === id);

  const products = useMemo<KitDetailProduct[]>(() => {
    if (!kit?.productRefs?.length) return [];
    const byId = new Map((workspace?.catalogProducts ?? []).map((p) => [p.id, p]));
    return kit.productRefs.map((ref) => ({
      name: ref.name,
      brand: ref.brand,
      img: byId.get(ref.catalogProductId),
    }));
  }, [kit, workspace?.catalogProducts]);

  return {
    isLoading: isLoading && !workspace,
    errorMessage:
      isError || !workspace
        ? error instanceof Error
          ? error.message
          : "Could not load kit"
        : null,
    kit,
    products,
    canEditKit: canWrite("kits"),
    canSendKit: canOperateCampaigns(),
  };
}
