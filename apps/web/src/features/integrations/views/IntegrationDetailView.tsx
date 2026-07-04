import { ArrowLeft, CircleHelp } from "lucide-react";
import type { Tile } from "../data";

export function IntegrationMark({
  tile,
  size = "normal",
}: {
  tile: Tile;
  size?: "normal" | "large";
}) {
  return (
    <span className={`bonus-integ-logo bonus-integ-logo--${size}`} aria-hidden="true">
      {tile.icon ? (
        <img src={tile.icon} alt="" />
      ) : (
        <span style={{ background: tile.tone }}>{tile.mark}</span>
      )}
    </span>
  );
}

function detailCopy(tile: Tile) {
  if (tile.id === "slack") {
    return "Install our Slack app to announce gifting activity in Slack and create gift moments without leaving Slack.";
  }
  if (tile.id === "microsoft-teams") {
    return "Install our Microsoft Teams app to announce gifting activity and keep employee moments visible in team channels.";
  }
  if (tile.id === "google-chat") {
    return "Connect Google Chat to share gifting updates with the right spaces automatically.";
  }
  if (tile.id === "hris-connect") {
    return "Choose your HRIS or HRMS provider and keep employee data synced for automated gifting workflows.";
  }
  return (
    tile.desc ??
    `Connect ${tile.name} to ShelfMerch and automate this part of your gifting workflow.`
  );
}

export function IntegrationDetailView({
  tile,
  onBack,
  onInstall,
  onSupport,
}: {
  tile: Tile;
  onBack: () => void;
  onInstall: (tile: Tile) => void;
  onSupport: () => void;
}) {
  return (
    <div className="bonus-integ-detail-page">
      <button type="button" className="bonus-integ-back" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Back to integrations</span>
      </button>
      <div className="bonus-integ-detail-card">
        {(tile.icon || tile.mark) && <IntegrationMark tile={tile} size="large" />}
        <h1>{tile.name} Integration</h1>
        <p>{detailCopy(tile)}</p>
        <button type="button" className="bonus-integ-install" onClick={() => onInstall(tile)}>
          {(tile.icon || tile.mark) && <IntegrationMark tile={tile} />}
          <span>{tile.id === "hris-connect" ? "Choose provider" : `Add to ${tile.name}`}</span>
        </button>
        <div className="bonus-integ-help">
          <CircleHelp size={14} aria-hidden="true" />
          <span>Can't figure it out? Just </span>
          <button type="button" onClick={onSupport}>
            drop us a line.
          </button>
        </div>
      </div>
    </div>
  );
}
