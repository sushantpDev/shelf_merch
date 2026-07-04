import { useParams, useSearchParams } from "react-router";
import { useWorkspace } from "@/hooks/useWorkspace";
import { mergeCatalogProductDetails } from "@/services/mappers";
import { collectionLinkedToShop } from "../types";
import type { UiCollection, UiProduct, UiShop } from "../model";

export type ShopDesignDetailVm = {
  isLoading: boolean;
  errorMessage: string | null;
  shopId: string;
  shop: UiShop | null;
  collection: UiCollection | null;
  product: UiProduct | null;
  productIndex: number;
};

/** Controller for the shop design detail page: route params, collection/product lookup. */
export function useShopDesignDetailController(): ShopDesignDetailVm {
  const { id: shopId, collectionId } = useParams() as { id: string; collectionId: string };
  const rawP = Number(useSearchParams()[0].get("p"));
  const productIndex = Number.isFinite(rawP) ? Math.max(0, Math.floor(rawP)) : 0;
  const { data: workspace, isLoading, isError, error } = useWorkspace();

  const shop = workspace?.shops.find((s) => s.id === shopId) ?? null;
  const collection =
    workspace?.collections.find(
      (c) =>
        (c.id === collectionId || c.code === collectionId) && collectionLinkedToShop(c, shopId),
    ) ?? null;
  const rawProduct = collection?.products[productIndex] ?? null;
  const product = rawProduct
    ? mergeCatalogProductDetails(rawProduct, workspace?.catalogProducts ?? [])
    : null;

  return {
    isLoading: isLoading && !workspace,
    errorMessage:
      isError || !workspace
        ? error instanceof Error
          ? error.message
          : "Could not load design"
        : null,
    shopId,
    shop,
    collection,
    product,
    productIndex,
  };
}
