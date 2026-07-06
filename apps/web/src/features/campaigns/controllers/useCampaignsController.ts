import { useState } from "react";
import { useNavigate } from "react-router";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import { COMPLETE_STATUSES, isLiveCampaign } from "../model";
import type { UiCampaign, UiKit, UiShop } from "../model";

const PER_PAGE = 5;

export const CAMPAIGN_FILTERS = ["all", "live", "draft", "completed"] as const;
export type CampaignFilter = (typeof CAMPAIGN_FILTERS)[number];

export type CampaignStats = {
  total: number;
  live: number;
  draft: number;
  recipients: number;
};

export type SendGiftView = "choose" | "points" | "kit";

export type SendGiftVm = {
  open: boolean;
  view: SendGiftView;
  availableKits: UiKit[];
  availableShops: UiShop[];
  onOpenChange: (open: boolean) => void;
  onPickKitView: () => void;
  onStartSendPoints: () => void;
  onSelectShopForPoints: (shopId: string) => void;
  onBackToChoose: () => void;
  onSelectKit: (kitId: string) => void;
  onCreateKit: () => void;
  onCreateShop: () => void;
  canCreateKit: boolean;
  canCreateShop: boolean;
};

export type CampaignsVm = {
  isLoading: boolean;
  errorMessage: string | null;
  hasCampaigns: boolean;
  canSend: boolean;
  stats: CampaignStats;
  filter: CampaignFilter;
  search: string;
  pageItems: UiCampaign[];
  page: number;
  totalPages: number;
  totalFiltered: number;
  showingStart: number;
  showingEnd: number;
  onFilter: (filter: CampaignFilter) => void;
  onSearch: (search: string) => void;
  onPage: (page: number) => void;
  onSendGift: () => void;
  gift: SendGiftVm;
};

/** Controller for the campaigns list screen: workspace slice, table state, Send Gift dialog. */
export function useCampaignsController(): CampaignsVm {
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const navigate = useNavigate();
  const { canOperateCampaigns, canWrite } = useTenantAccess();

  const [giftOpen, setGiftOpen] = useState(false);
  const [giftView, setGiftView] = useState<SendGiftView>("choose");
  const [filter, setFilter] = useState<CampaignFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const campaigns = workspace?.campaigns ?? [];
  const shops = workspace?.shops ?? [];
  const stats: CampaignStats = {
    total: campaigns.length,
    live: campaigns.filter(isLiveCampaign).length,
    draft: campaigns.filter((c) => c.status === "draft").length,
    recipients: campaigns.reduce((s, c) => s + (c.recipientCount || 0), 0),
  };

  let filtered = campaigns;
  if (filter === "live") filtered = filtered.filter(isLiveCampaign);
  else if (filter === "draft") filtered = filtered.filter((c) => c.status === "draft");
  else if (filter === "completed")
    filtered = filtered.filter((c) => COMPLETE_STATUSES.includes(c.status));
  const q = search.toLowerCase();
  if (q) filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const pageItems = filtered.slice(start, start + PER_PAGE);

  const availableShops = shops.filter((s) => s.id);

  function closeGift() {
    setGiftOpen(false);
    setGiftView("choose");
  }

  function goToSendPoints(shopId: string) {
    closeGift();
    navigate(`/app/campaigns/send-points?shop=${encodeURIComponent(shopId)}`);
  }

  return {
    isLoading: isLoading && !workspace,
    errorMessage:
      isError || !workspace
        ? error instanceof Error
          ? error.message
          : "Could not load campaigns"
        : null,
    hasCampaigns: campaigns.length > 0,
    canSend: canOperateCampaigns(),
    stats,
    filter,
    search,
    pageItems,
    page: safePage,
    totalPages,
    totalFiltered,
    showingStart: totalFiltered ? start + 1 : 0,
    showingEnd: Math.min(start + PER_PAGE, totalFiltered),
    onFilter: (f) => {
      setFilter(f);
      setPage(1);
    },
    onSearch: (s) => {
      setSearch(s);
      setPage(1);
    },
    onPage: setPage,
    onSendGift: () => setGiftOpen(true),
    gift: {
      open: giftOpen,
      view: giftView,
      availableKits: (workspace?.kits ?? []).filter((k) => k.id),
      availableShops,
      onOpenChange: (o) => {
        setGiftOpen(o);
        if (!o) setGiftView("choose");
      },
      onPickKitView: () => setGiftView("kit"),
      onStartSendPoints: () => {
        if (availableShops.length === 1) {
          goToSendPoints(availableShops[0].id);
          return;
        }
        setGiftView("points");
      },
      onSelectShopForPoints: goToSendPoints,
      onBackToChoose: () => setGiftView("choose"),
      onSelectKit: (kitId) => {
        closeGift();
        navigate(`/app/kits/${kitId}/send`);
      },
      onCreateKit: () => {
        closeGift();
        navigate("/app/kits/new");
      },
      onCreateShop: () => {
        closeGift();
        navigate("/app/shops/new");
      },
      canCreateKit: canWrite("kits"),
      canCreateShop: canWrite("shops"),
    },
  };
}
