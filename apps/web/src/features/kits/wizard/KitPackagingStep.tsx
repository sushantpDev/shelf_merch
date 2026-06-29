import { Box, Package, Send } from "lucide-react";
import kitPackagingNone from "../../../../assets/kit-packaging-none.png";
import kitPackagingBox from "../../../../assets/kit-packaging-box.png";

type Pkg = "none" | "box";

export function KitPackagingStep({
  kitName,
  itemCount,
  packaging,
  onPackaging,
}: {
  kitName: string;
  itemCount: number;
  packaging: Pkg;
  onPackaging: (pkg: Pkg) => void;
}) {
  const previewSrc = packaging === "none" ? kitPackagingNone : kitPackagingBox;
  const label = packaging === "none" ? "Standard mailer" : "Premium box";

  return (
    <div className="kt-pkg-layout">
      <div className="sw-form-card">
        <div className="sw-eyebrow-badge">Step 4 of 4 · Packaging</div>
        <h1
          style={{
            fontSize: 28,
            marginBottom: 10,
            fontFamily: "var(--disp)",
            letterSpacing: "-.03em",
            color: "var(--ink)",
          }}
        >
          Choose packaging
        </h1>
        <p
          className="muted"
          style={{ marginBottom: 24, maxWidth: "48ch", lineHeight: 1.6, fontSize: 14 }}
        >
          How should "{kitName}" arrive? Premium packaging is charged per kit — recipients see the
          unboxing experience you choose.
        </p>

        <div className="kt-pkg-options">
          <PkgOption
            on={packaging === "none"}
            title="No packaging"
            desc="Items ship in standard protective mailers."
            price="Free"
            onClick={() => onPackaging("none")}
          />
          <PkgOption
            on={packaging === "box"}
            title="Premium shipping box"
            desc="Branded rigid box with crinkle-paper fill."
            price="₹49 / kit"
            onClick={() => onPackaging("box")}
          />
        </div>

        <div className="sw-name-tips" style={{ marginTop: 24 }}>
          <div
            className="row"
            style={{
              gap: 10,
              alignItems: "center",
              fontWeight: 700,
              fontSize: 13.5,
              marginBottom: 10,
              color: "var(--brand-700)",
            }}
          >
            <Box size={18} /> Reusable kit
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
            Once published, this kit is reusable — send it to new recipients any time without
            rebuilding.
          </p>
        </div>
      </div>

      <div className="sw-name-aside">
        <div className="sw-name-preview-card">
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 14,
              color: "var(--ink-2)",
              letterSpacing: ".03em",
              textTransform: "uppercase",
            }}
          >
            Packaging Preview
          </div>
          <div className="sw-name-preview-imgwrap kt-pkg-preview-wrap">
            <img src={previewSrc} alt={`${label} preview`} />
            <div className="sw-name-preview-float">
              <div className="sw-name-preview-icon">
                <Box size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="sw-name-preview-label">{kitName}</div>
                <div className="mut3" style={{ fontSize: 11, marginTop: 2 }}>
                  {label}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sw-name-next-card">
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 18,
              color: "var(--ink-2)",
              letterSpacing: ".03em",
              textTransform: "uppercase",
            }}
          >
            What's included
          </div>
          <div className="sw-name-next-steps">
            <Included
              icon={<Package size={18} />}
              title={`${itemCount} branded product${itemCount === 1 ? "" : "s"}`}
              copy="Your selected items ship together in one shipment."
            />
            <Included
              icon={<Box size={18} />}
              title={packaging === "none" ? "Protective mailer" : "Premium branded box"}
              copy={
                packaging === "none"
                  ? "Lightweight poly mailer with your kit items inside."
                  : "Rigid box with crinkle-paper fill and logo on the lid."
              }
            />
            <Included
              icon={<Send size={18} />}
              title="Ready to send"
              copy="Publish now and send this kit to recipients any time."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PkgOption({
  on,
  title,
  desc,
  price,
  onClick,
}: {
  on: boolean;
  title: string;
  desc: string;
  price: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`kt-pkg-option ${on ? "on" : ""}`} onClick={onClick}>
      <div className="rd" />
      <div className="kt-pkg-option-copy">
        <h4>{title}</h4>
        <p>{desc}</p>
      </div>
      <b className="kt-pkg-option-price">{price}</b>
    </button>
  );
}

function Included({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return (
    <div className="sw-name-next-step">
      <div className="sw-name-next-icon">{icon}</div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink)" }}>{title}</div>
        <div className="mut3" style={{ fontSize: 12, marginTop: 3, lineHeight: 1.4 }}>
          {copy}
        </div>
      </div>
    </div>
  );
}
