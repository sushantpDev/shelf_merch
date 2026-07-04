import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useWorkspace } from "@/hooks/useWorkspace";
import { collectionLinkedToShop, shopTabFromSearch, type ShopTab } from "../types";
import type { UiCollection, UiProduct, UiShop } from "../model";

export type ShopDetailVm = {
  isLoading: boolean;
  errorMessage: string | null;
  shop: UiShop | null;
  collections: UiCollection[];
  catalogProducts: UiProduct[];
  tab: ShopTab;
  onSelectTab: (tab: ShopTab) => void;
  onSendPoints: () => void;
  onStartDesigning: () => void;
  onViewLiveShop: () => void;
};

/** Controller for the shop detail page: route param, tab state (URL-synced), navigation. */
export function useShopDetailController(): ShopDetailVm {
  const { id } = useParams() as { id: string };
  const tabSearch = useSearchParams()[0].get("tab") ?? undefined;
  const navigate = useNavigate();
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const [tab, setTab] = useState<ShopTab>(() => shopTabFromSearch(tabSearch) ?? "Branded Swag");

  const shop = workspace?.shops.find((s) => s.id === id) ?? null;
  const collections = useMemo(
    () =>
      shop ? (workspace?.collections ?? []).filter((c) => collectionLinkedToShop(c, shop.id)) : [],
    [workspace?.collections, shop],
  );

  useEffect(() => {
    const fromSearch = shopTabFromSearch(tabSearch);
    if (fromSearch) setTab(fromSearch);
  }, [tabSearch]);

  function onSelectTab(next: ShopTab) {
    setTab(next);
    const slug = next.toLowerCase().replace(/\s+/g, "-");
    void navigate(`/app/shops/${id}?tab=${encodeURIComponent(slug)}`, { replace: true });
  }

  return {
    isLoading: isLoading && !workspace,
    errorMessage:
      isError || !workspace
        ? error instanceof Error
          ? error.message
          : "Could not load shop"
        : null,
    shop,
    collections,
    catalogProducts: workspace?.catalogProducts ?? [],
    tab,
    onSelectTab,
    onSendPoints: () =>
      shop && navigate(`/app/campaigns/send-points?shop=${encodeURIComponent(shop.id)}`),
    onStartDesigning: () => shop && navigate(`/app/swag/new?shop=${encodeURIComponent(shop.id)}`),
    onViewLiveShop: () => shop && window.open(`/shop/${shop.id}`, "_blank", "noopener"),
  };
}
