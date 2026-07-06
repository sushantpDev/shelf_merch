import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import { useWorkspace } from "@/hooks/useWorkspace";
import { collectionLinkedToShop, SHOP_TABS, shopTabFromSearch, type ShopTab } from "../types";
import type { UiCollection, UiProduct, UiShop } from "../model";

const MANAGER_TABS: ShopTab[] = ["Branded Swag", "Shop Catalog", "Sent Gifts", "Reports"];

export type ShopDetailVm = {
  isLoading: boolean;
  errorMessage: string | null;
  shop: UiShop | null;
  collections: UiCollection[];
  catalogProducts: UiProduct[];
  tab: ShopTab;
  visibleTabs: ShopTab[];
  canEditShop: boolean;
  canDesignSwag: boolean;
  canSendPoints: boolean;
  onSelectTab: (tab: ShopTab) => void;
  onSendPoints: (campaignId?: string) => void;
  onStartDesigning: () => void;
  onViewLiveShop: () => void;
};

/** Controller for the shop detail page: route param, tab state (URL-synced), navigation. */
export function useShopDetailController(): ShopDetailVm {
  const { id } = useParams() as { id: string };
  const tabSearch = useSearchParams()[0].get("tab") ?? undefined;
  const navigate = useNavigate();
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const { canWrite, canOperateCampaigns } = useTenantAccess();
  const canEditShop = canWrite("shops");
  const canDesignSwag = canWrite("swag");
  const canSendPoints = canOperateCampaigns();
  const visibleTabs = canEditShop ? [...SHOP_TABS] : MANAGER_TABS;
  const [tab, setTab] = useState<ShopTab>(() => {
    const fromSearch = shopTabFromSearch(tabSearch);
    if (fromSearch && (canEditShop || MANAGER_TABS.includes(fromSearch))) return fromSearch;
    return "Branded Swag";
  });

  const shop = workspace?.shops.find((s) => s.id === id) ?? null;
  const collections = useMemo(
    () =>
      shop ? (workspace?.collections ?? []).filter((c) => collectionLinkedToShop(c, shop.id)) : [],
    [workspace?.collections, shop],
  );

  useEffect(() => {
    const fromSearch = shopTabFromSearch(tabSearch);
    if (fromSearch && visibleTabs.includes(fromSearch)) setTab(fromSearch);
  }, [tabSearch, visibleTabs]);

  useEffect(() => {
    if (!visibleTabs.includes(tab)) setTab(visibleTabs[0] ?? "Branded Swag");
  }, [tab, visibleTabs]);

  function onSelectTab(next: ShopTab) {
    setTab(next);
    const slug = next.toLowerCase().replace(/\s+/g, "-");
    void navigate(`/app/shops/${id}?tab=${encodeURIComponent(slug)}`, { replace: true });
  }

  function onSendPoints(campaignId?: string) {
    if (!shop || !canSendPoints) return;
    const params = new URLSearchParams({ shop: shop.id });
    if (campaignId) params.set("campaign", campaignId);
    navigate(`/app/campaigns/send-points?${params}`);
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
    visibleTabs,
    canEditShop,
    canDesignSwag,
    canSendPoints,
    onSelectTab,
    onSendPoints,
    onStartDesigning: () =>
      canDesignSwag && shop && navigate(`/app/swag/new?shop=${encodeURIComponent(shop.id)}`),
    onViewLiveShop: () => shop && window.open(`/shop/${shop.id}`, "_blank", "noopener"),
  };
}
