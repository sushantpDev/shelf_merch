import { LoadingState } from "@/components/LoadingState";
import type { CampaignsVm } from "../controllers/useCampaignsController";
import { CampaignsEmptyStateView } from "./CampaignsEmptyStateView";
import { CampaignsTableView } from "./CampaignsTableView";
import { SendGiftDialogView } from "./SendGiftDialogView";

/** Campaigns list screen: loading/error states, empty state or table, Send Gift dialog. */
export function CampaignsView(vm: CampaignsVm) {
  if (vm.isLoading) {
    return <LoadingState message="Loading campaigns…" fullScreen={false} />;
  }
  if (vm.errorMessage) {
    return (
      <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
        {vm.errorMessage}
      </div>
    );
  }

  return (
    <>
      {vm.hasCampaigns ? (
        <CampaignsTableView
          stats={vm.stats}
          filter={vm.filter}
          search={vm.search}
          pageItems={vm.pageItems}
          page={vm.page}
          totalPages={vm.totalPages}
          totalFiltered={vm.totalFiltered}
          showingStart={vm.showingStart}
          showingEnd={vm.showingEnd}
          canSend={vm.canSend}
          onFilter={vm.onFilter}
          onSearch={vm.onSearch}
          onPage={vm.onPage}
          onSendGift={vm.onSendGift}
        />
      ) : (
        <CampaignsEmptyStateView
          canSend={vm.canSend}
          onSendGift={vm.onSendGift}
          onSendPointsCampaign={vm.onSendPointsCampaign}
          onSendKitCampaign={vm.onSendKitCampaign}
        />
      )}
      <SendGiftDialogView {...vm.gift} />
    </>
  );
}
