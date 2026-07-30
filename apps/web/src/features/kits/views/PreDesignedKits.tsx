import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { PlatformKitTemplate } from "../model";
import type { PreDesignedKitsVm } from "../controllers/usePreDesignedKitsController";
import { curatedPreviewBtnStyle, curatedSendBtnStyle } from "../curatedKitCardStyles";
import noKitsYetImg from "../../../../assets/no-kits-yet.png";

function templateImage(kit: PlatformKitTemplate): string {
  if (kit.heroImage) return resolveMediaUrl(kit.heroImage) || noKitsYetImg;
  return resolveMediaUrl(kit.imageUrls?.[0]) || noKitsYetImg;
}

function templateItemLabel(kit: PlatformKitTemplate): string {
  const itemCount =
    (Array.isArray(kit.itemImages) && kit.itemImages.length) ||
    kit.items?.length ||
    0;
  return itemCount ? `${itemCount} item${itemCount === 1 ? "" : "s"}` : "Curated bundle";
}

export function PreDesignedKitsView({
  isLoading,
  kits,
  canSendKits,
  onPreview,
  onSend,
  sendPending,
}: PreDesignedKitsVm) {
  if (isLoading) {
    return (
      <div className="muted" style={{ textAlign: "center", padding: "32px 12px", fontSize: 13 }}>
        Loading pre-designed kits…
      </div>
    );
  }
  if (!kits || kits.length === 0) {
    return (
      <div className="muted" style={{ textAlign: "center", padding: "32px 12px", fontSize: 13 }}>
        No pre-designed kits available yet.
      </div>
    );
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
      {kits.map((kit) => (
        <div
          key={kit._id}
          className="card"
          style={{
            padding: 14,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            border: "1px solid var(--line)",
            borderRadius: "var(--r)",
            background: "#fff",
          }}
        >
          <div
            style={{
              width: "100%",
              aspectRatio: "1.4",
              background: "var(--gray-100)",
              borderRadius: "var(--r-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              marginBottom: 10,
            }}
          >
            <img
              src={templateImage(kit)}
              alt={kit.name}
              loading="lazy"
              style={{ maxHeight: "90%", maxWidth: "90%", objectFit: "contain" }}
            />
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 13.5,
              marginBottom: 2,
              color: "var(--ink)",
              textAlign: "center",
            }}
          >
            {kit.name}
          </div>
          <div className="muted" style={{ fontSize: 11.5, marginBottom: 10, textAlign: "center" }}>
            {templateItemLabel(kit)}
          </div>
          <div style={{ display: "flex", gap: 8, width: "100%" }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onPreview(kit)}
              style={curatedPreviewBtnStyle}
            >
              Preview
            </button>
            {canSendKits ? (
              <button
                type="button"
                className="btn btn-brand btn-sm"
                onClick={() => void onSend(kit)}
                style={curatedSendBtnStyle}
                disabled={sendPending}
              >
                Send
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
