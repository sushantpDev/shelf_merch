import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/hooks/useWorkspace";
import { inr } from "@/components/platform/platform-ui";
import { POINT_VALUE } from "@/features/send/money";
import { useCampaignRecipients, useDeleteCampaign } from "@/features/campaigns/model";
import type { CampaignRecipientRow } from "@/services/mutations-api";
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

function recipientAmount(creditAmount: number | undefined, shop: UiShop) {
  const amount = creditAmount ?? 0;
  if (amount <= 0) return "—";
  if (shop.currencyMode === "inr") return inr(amount);
  if (shop.currencyMode === "priceless") return "Priceless";
  return `${(amount / POINT_VALUE).toFixed(2)} Pts`;
}

function recipientStatusLabel(status?: string) {
  switch (status) {
    case "invited":
      return "Invited";
    case "opened":
      return "Opened";
    case "verified":
      return "Verified";
    case "redeemed":
      return "Redeemed";
    case "order_created":
      return "Order placed";
    case "expired":
      return "Expired";
    default:
      return status || "—";
  }
}

function CampaignRecipientsPanel({
  campaignId,
  shop,
  isDraft,
  canSendPoints,
  deleting,
  onDelete,
}: {
  campaignId: string;
  shop: UiShop;
  isDraft: boolean;
  canSendPoints: boolean;
  deleting: boolean;
  onDelete: () => void;
}) {
  const { data, isLoading, isError } = useCampaignRecipients(campaignId);
  const recipients = data?.recipients ?? [];

  return (
    <div style={{ padding: "14px 16px" }}>
      <div
        className="mut3"
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".04em",
          marginBottom: 10,
        }}
      >
        Recipients
      </div>
      {isLoading ? (
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          Loading recipients…
        </p>
      ) : isError ? (
        <p style={{ fontSize: 13, margin: 0, color: "var(--danger)" }}>
          Could not load recipients.
        </p>
      ) : recipients.length === 0 ? (
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          No recipients added yet.
        </p>
      ) : (
        <table className="tbl" style={{ marginBottom: isDraft ? 12 : 0 }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((r: CampaignRecipientRow) => (
              <tr key={String(r._id ?? r.email)}>
                <td style={{ fontWeight: 500 }}>{r.name || "—"}</td>
                <td className="muted">{r.email || "—"}</td>
                <td className="num">{recipientAmount(r.creditAmount, shop)}</td>
                <td className="muted" style={{ fontSize: 13 }}>
                  {recipientStatusLabel(r.redemptionStatus)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {isDraft && canSendPoints ? (
        <button
          type="button"
          className="lnk"
          style={{
            background: "none",
            border: "none",
            cursor: deleting ? "wait" : "pointer",
            padding: 0,
            color: "var(--danger)",
            fontWeight: 600,
            letterSpacing: ".03em",
            textTransform: "uppercase",
            fontSize: 12,
          }}
          disabled={deleting}
          onClick={onDelete}
        >
          {deleting ? "Deleting…" : "Delete incomplete order"}
        </button>
      ) : null}
    </div>
  );
}

const centerHeadStyle = { textAlign: "center" } as const;
const centerCellStyle = {
  textAlign: "center",
  verticalAlign: "middle",
} as const;

export function SentGiftsTab({
  shop,
  canSendPoints = false,
  onSendPoints,
}: {
  shop: UiShop;
  canSendPoints?: boolean;
  onSendPoints: (campaignId?: string) => void;
}) {
  const { data: workspace } = useWorkspace();
  const deleteCampaign = useDeleteCampaign();
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
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
      setExpandedCampaignId(null);
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
              const expanded = expandedCampaignId === campaign.id;
              const recipientCount = displayRecipientCount(campaign);
              const canExpand = recipientCount > 0 || isDraft;
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
                      {recipientCount.toLocaleString("en-IN")}
                    </td>
                    <td className="muted data-list-cell" style={centerCellStyle}>
                      {formatCampaignDate(campaign.createdAt)}
                    </td>
                    <td className="data-list-cell" style={centerCellStyle}>
                      <div
                        style={{
                          display: "inline-flex",
                          gap: 10,
                          alignItems: "center",
                          justifyContent: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isDraft && canSendPoints ? (
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
                        ) : null}
                        {canExpand ? (
                          <button
                            type="button"
                            aria-label={expanded ? "Hide recipients" : "Show recipients"}
                            aria-expanded={expanded}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 4,
                              display: "inline-flex",
                              alignItems: "center",
                              color: "var(--ink-2)",
                              borderRadius: 6,
                            }}
                            onClick={() =>
                              setExpandedCampaignId((id) =>
                                id === campaign.id ? null : campaign.id,
                              )
                            }
                          >
                            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                  {expanded && canExpand ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          background: "var(--surface-2)",
                          padding: 0,
                          borderBottom: "1px solid var(--line-2)",
                        }}
                      >
                        <CampaignRecipientsPanel
                          campaignId={campaign.id}
                          shop={shop}
                          isDraft={isDraft}
                          canSendPoints={canSendPoints}
                          deleting={deletingId === campaign.id}
                          onDelete={() => void deleteIncompleteOrder(campaign.id)}
                        />
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
