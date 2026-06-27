import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { PlatformKitTemplate } from "@/services/api-bridge";
import { kitLaunch, usePlatformKits } from "./hooks";
import noKitsYetImg from "../../../assets/no-kits-yet.png";

function templateImage(kit: PlatformKitTemplate): string {
  return resolveMediaUrl(kit.imageUrls?.[0]) || noKitsYetImg;
}

function templateItemLabel(kit: PlatformKitTemplate): string {
  const count = kit.items?.length ?? 0;
  return count ? `${count} item${count === 1 ? "" : "s"}` : "Curated bundle";
}

export function PreDesignedKits() {
  const { data: kits, isLoading } = usePlatformKits();

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
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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
              background: "#f4f6f4",
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
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-block"
            style={{ border: "1px solid var(--line)", fontWeight: 600, fontSize: 12, height: 32 }}
            onClick={() => kitLaunch.use(kit._id)}
          >
            Use this kit
          </button>
        </div>
      ))}
    </div>
  );
}
