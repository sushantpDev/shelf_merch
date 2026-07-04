import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/hooks/useWorkspace";
import { inr } from "@/components/platform/platform-ui";
import { POINT_VALUE } from "@/features/send/money";
import { useDeleteCampaign } from "@/features/campaigns/model";
import type { UiCampaign, UiShop } from "@/services/mappers";
import sentGiftsEmptyImg from "../../../../assets/sent-gifts-empty.png";

const INCOMPLETE_STATUSES = ["draft", "recipients_uploaded", "credits_allocated", "approved"];

function isIncompleteCampaign(campaign: UiCampaign) {
  return INCOMPLETE_STATUSES.includes(campaign.status);
}

function statusPill(campaign: UiCampaign) {
  if (isIncompleteCampaign(campaign)) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          fontSize: 13.5,
          fontWeight: 500,
          color: "var(--ink)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 16,
            height: 16,
            borderRadius: 2,
            border: "1.5px solid #F2B31B",
            background: "#FFF7D6",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
            flex: "none",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#F2B31B",
              display: "block",
            }}
          />
        </span>
        Incomplete
      </span>
    );
  }
  if (["launched", "redemption_open", "redemption_closed", "fulfilled"].includes(campaign.status)) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          fontSize: 13.5,
          fontWeight: 500,
          color: "var(--brand-d)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 16,
            height: 16,
            borderRadius: 2,
            border: "1.5px solid var(--brand-l)",
            background: "var(--brand-50)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
            flex: "none",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--brand-l)",
              display: "block",
            }}
          />
        </span>
        Completed
      </span>
    );
  }
  return (
    <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-2)" }}>
      {campaign.status}
    </span>
  );
}

function pointsPerRecipient(campaign: UiCampaign, shop: UiShop) {
  if ((campaign.creditsPerRecipient ?? 0) <= 0) return "—";
  if (shop.currencyMode === "inr") return inr(campaign.creditsPerRecipient);
  if (shop.currencyMode === "priceless") return "Priceless";
  return `${(campaign.creditsPerRecipient / POINT_VALUE).toFixed(2)} Pts`;
}

function formatCampaignDate(createdAt?: string) {
  if (!createdAt) return "—";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN");
}

function displayRecipientCount(campaign: UiCampaign) {
  if (isIncompleteCampaign(campaign)) {
    const planned = campaign.draftState?.recips;
    if (typeof planned === "number" && planned > 0) return planned;
  }
  return campaign.recipientCount;
}

function campaignSubtext(campaign: UiCampaign) {
  if (isIncompleteCampaign(campaign)) return "Saved draft";
  return campaign.type === "points" ? "Points send" : "Campaign";
}

const centerHeadStyle = { textAlign: "center" } as const;
const centerCellStyle = {
  textAlign: "center",
  verticalAlign: "middle",
} as const;

export function SentGiftsTab({
  shop,
  onSendPoints,
}: {
  shop: UiShop;
  onSendPoints: (campaignId?: string) => void;
}) {
  const { data: workspace } = useWorkspace();
  const deleteCampaign = useDeleteCampaign();
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const campaigns = useMemo(
    () =>
      (workspace?.campaigns ?? [])
        .filter((campaign) => campaign.shopId === shop.id)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()),
    [shop.id, workspace?.campaigns],
  );

  async function deleteIncompleteOrder(campaignId: string) {
    setDeletingId(campaignId);
    try {
      await deleteCampaign.mutateAsync(campaignId);
      setExpandedDraftId(null);
      toast.success("Draft deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete draft");
    } finally {
      setDeletingId(null);
    }
  }

  if (campaigns.length > 0) {
    return (
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: 20,
            borderBottom: "1px solid var(--line)",
          }}
        >
          <h3 style={{ marginBottom: 6 }}>Sent Gifts</h3>
          <p className="muted">Campaigns launched from {shop.name} and saved drafts appear here.</p>
        </div>

        <table className="tbl data-list-table">
          <colgroup>
            <col style={{ width: "28%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Gift Name</th>
              <th>Sent By</th>
              <th>Budget / Recipient</th>
              <th style={centerHeadStyle}>Status</th>
              <th style={centerHeadStyle}>Recipients</th>
              <th style={centerHeadStyle}>Created On</th>
              <th style={centerHeadStyle} />
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => {
              const isDraft = isIncompleteCampaign(campaign);
              const expanded = expandedDraftId === campaign.id;
              return (
                <Fragment key={campaign.id}>
                  <tr>
                    <td className="data-list-cell">
                      <div className="data-list-primary">{campaign.name || "Points campaign"}</div>
                      <div className="data-list-secondary">{campaignSubtext(campaign)}</div>
                    </td>
                    <td className="data-list-cell">
                      <div className="data-list-primary">{campaign.senderName || "—"}</div>
                    </td>
                    <td className="num data-list-cell">
                      <div className="data-list-primary">{pointsPerRecipient(campaign, shop)}</div>
                    </td>
                    <td className="data-list-cell" style={centerCellStyle}>
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        {statusPill(campaign)}
                      </div>
                    </td>
                    <td className="num data-list-cell" style={centerCellStyle}>
                      {displayRecipientCount(campaign).toLocaleString("en-IN")}
                    </td>
                    <td className="muted data-list-cell" style={centerCellStyle}>
                      {formatCampaignDate(campaign.createdAt)}
                    </td>
                    <td className="data-list-cell" style={centerCellStyle}>
                      {isDraft ? (
                        <div
                          style={{
                            display: "inline-flex",
                            gap: 10,
                            alignItems: "center",
                            justifyContent: "center",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <button
                            type="button"
                            className="lnk"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                              whiteSpace: "nowrap",
                            }}
                            onClick={() => onSendPoints(campaign.id)}
                          >
                            Finish sending
                          </button>
                          <button
                            type="button"
                            aria-label={expanded ? "Collapse draft actions" : "Expand draft actions"}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                              display: "inline-flex",
                              alignItems: "center",
                              color: "var(--ink-2)",
                            }}
                            onClick={() =>
                              setExpandedDraftId((id) => (id === campaign.id ? null : campaign.id))
                            }
                          >
                            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                  {isDraft && expanded ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          background: "var(--surface-2)",
                          padding: 0,
                          borderBottom: "1px solid var(--line-2)",
                        }}
                      >
                        <button
                          type="button"
                          className="lnk"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: deletingId === campaign.id ? "wait" : "pointer",
                            padding: "12px 16px",
                            color: "var(--danger)",
                            fontWeight: 600,
                            letterSpacing: ".03em",
                            textTransform: "uppercase",
                            fontSize: 12,
                          }}
                          disabled={deletingId === campaign.id}
                          onClick={() => void deleteIncompleteOrder(campaign.id)}
                        >
                          {deletingId === campaign.id ? "Deleting…" : "Delete incomplete order"}
                        </button>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="card sent-gifts-empty">
      <div className="sent-gifts-empty-inner">
        <img src={sentGiftsEmptyImg} alt="" className="sent-gifts-empty-art" />
        <div className="sent-gifts-empty-content">
          <h3>You haven&apos;t sent any points</h3>
          <p className="muted">
            Send points to employees, customers, or partners — they can redeem from your shop catalog.
          </p>
        </div>
      </div>
    </div>
  );
}
