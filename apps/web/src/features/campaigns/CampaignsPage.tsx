import { useState } from "react";
import { LoadingState } from "@/components/LoadingState";
import { useWorkspace } from "@/hooks/useWorkspace";
import { CampaignsEmptyState } from "./CampaignsEmptyState";
import { CampaignsTable } from "./CampaignsTable";
import { SendGiftDialog } from "./SendGiftDialog";

export function CampaignsPage() {
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const [giftOpen, setGiftOpen] = useState(false);

  if (isLoading && !workspace) {
    return <LoadingState message="Loading campaigns…" fullScreen={false} />;
  }
  if (isError || !workspace) {
    return (
      <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
        {error instanceof Error ? error.message : "Could not load campaigns"}
      </div>
    );
  }

  const campaigns = workspace.campaigns;

  return (
    <>
      {campaigns.length === 0 ? (
        <CampaignsEmptyState onSendGift={() => setGiftOpen(true)} />
      ) : (
        <CampaignsTable campaigns={campaigns} onSendGift={() => setGiftOpen(true)} />
      )}
      <SendGiftDialog open={giftOpen} kits={workspace.kits} onOpenChange={setGiftOpen} />
    </>
  );
}
