import { Gift, Lightbulb, Package, PenLine, Shirt } from "lucide-react";
import kitPreview from "../../../../assets/kit-preview.png";

const EXAMPLES = ["Welcome Kit", "New Hire Kit", "Onboarding Box"];

export function KitNameStep({
  name,
  desc,
  onName,
  onDesc,
}: {
  name: string;
  desc: string;
  onName: (name: string) => void;
  onDesc: (desc: string) => void;
}) {
  const valid = name.trim().length >= 4;

  return (
    <div className="sw-name-layout">
      <div className="sw-form-card">
        <div className="sw-eyebrow-badge">Step 1 of 4 · Setup</div>
        <h1
          style={{
            fontSize: 28,
            marginBottom: 10,
            fontFamily: "var(--disp)",
            letterSpacing: "-.03em",
            color: "var(--ink)",
          }}
        >
          Name your kit
        </h1>
        <p
          className="muted"
          style={{ marginBottom: 24, maxWidth: "48ch", lineHeight: 1.6, fontSize: 14 }}
        >
          A kit is a reusable bundle of products you can send to recipients at any time. Give it a
          clear name your team will recognize.
        </p>

        <div className="field" style={{ marginBottom: 20 }}>
          <label className="lbl" style={{ fontWeight: 700, marginBottom: 8 }}>
            Kit name
          </label>
          <div className="sw-name-input-container">
            <input
              className="inp"
              value={name}
              maxLength={32}
              placeholder="e.g. Welcome Kit"
              autoFocus
              onChange={(e) => onName(e.target.value)}
            />
          </div>
          <div
            className="row"
            style={{ justifyContent: "space-between", marginTop: 8, fontSize: 12, gap: 8 }}
          >
            <span className="mut3">
              {valid ? "Looks good" : "Kit name must be at least 4 characters"}
            </span>
            <span className="mut3">{name.length}/32</span>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 20 }}>
          <label className="lbl" style={{ fontWeight: 700, marginBottom: 8 }}>
            Internal description{" "}
            <span
              className="mut3"
              style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0 }}
            >
              (optional)
            </span>
          </label>
          <textarea
            className="inp"
            rows={3}
            placeholder="e.g. Standard onboarding kit for new joiners"
            value={desc}
            onChange={(e) => onDesc(e.target.value)}
            style={{ resize: "vertical", minHeight: 88, padding: "12px 16px", lineHeight: 1.5 }}
          />
        </div>

        <div className="sw-name-examples" style={{ marginBottom: 28 }}>
          <div
            className="mut3"
            style={{
              fontSize: 12,
              marginBottom: 10,
              fontWeight: 600,
              letterSpacing: ".03em",
              textTransform: "uppercase",
            }}
          >
            Suggestions
          </div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" className="sw-name-chip" onClick={() => onName(ex)}>
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="sw-name-tips">
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
            <Lightbulb size={18} /> Naming Best Practices
          </div>
          <ul className="sw-name-tips-list">
            <li>Use campaign names, onboarding themes, or seasonal events</li>
            <li>Keep it short and recognizable for recipients and your team</li>
            <li>Don't worry — you can change the name or contents later</li>
          </ul>
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
            Kit Preview
          </div>
          <div className="sw-name-preview-imgwrap">
            <img src={kitPreview} alt="Kit merchandise preview" />
            <div className="sw-name-preview-float">
              <div className="sw-name-preview-icon">
                <Gift size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="sw-name-preview-label">{name || "Welcome Kit"}</div>
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
            Next Steps
          </div>
          <div className="sw-name-next-steps">
            <NextStep
              icon={<Shirt size={18} />}
              title="1. Choose products"
              copy="Select apparel, drinkware, tech, and more from the catalog."
            />
            <NextStep
              icon={<PenLine size={18} />}
              title="2. Brand your kit"
              copy="Upload your logo and add notes for branded mockups on each item."
            />
            <NextStep
              icon={<Package size={18} />}
              title="3. Choose packaging"
              copy="Pick standard mailers or premium branded boxes for delivery."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function NextStep({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
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
