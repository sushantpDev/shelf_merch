import { Box, Lightbulb, Pencil, Store } from "lucide-react";
import collectionPreview from "../../../../assets/collection-preview.png";

const EXAMPLES = ["Welcome Kit", "Summer Swag", "Team Essentials"];

const NEXT_STEPS: { icon: typeof Box; title: string; desc: string }[] = [
  {
    icon: Box,
    title: "1. Choose products",
    desc: "Select apparel, bags, drinkware, or technology items from the catalog.",
  },
  {
    icon: Pencil,
    title: "2. Add artwork",
    desc: "Position your logo and design elements directly on items in real-time.",
  },
  {
    icon: Store,
    title: "3. Publish collection",
    desc: "Make it live instantly in your department or corporate merchandise store.",
  },
];

export function NameStep({ name, onChange }: { name: string; onChange: (name: string) => void }) {
  return (
    <div className="sw-name-layout">
      <div className="sw-form-card">
        <div className="sw-eyebrow-badge">Step 1 of 3 · Setup</div>
        <h1
          style={{
            fontSize: 28,
            margin: "10px 0",
            fontFamily: "var(--disp)",
            letterSpacing: "-.03em",
          }}
        >
          Name your collection
        </h1>
        <p
          className="muted"
          style={{ marginBottom: 24, maxWidth: "48ch", lineHeight: 1.6, fontSize: 14 }}
        >
          Create a collection for your brand store. Give it a clear name so employees or customers
          can easily recognize it.
        </p>

        <div className="field" style={{ marginBottom: 20 }}>
          <label className="lbl" htmlFor="sw-name" style={{ fontWeight: 700, marginBottom: 8 }}>
            Collection name
          </label>
          <input
            id="sw-name"
            className="inp"
            value={name}
            maxLength={32}
            autoFocus
            placeholder="e.g. Welcome Kit"
            onChange={(e) => onChange(e.target.value)}
          />
          <div
            className="row"
            style={{ justifyContent: "space-between", marginTop: 8, fontSize: 12, gap: 8 }}
          >
            <span className="mut3">{name.trim() ? "Looks good" : "Enter a collection name"}</span>
            <span className="mut3">{name.length}/32</span>
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
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
              <button key={ex} type="button" className="sw-name-chip" onClick={() => onChange(ex)}>
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
            <li>Use your campaign name, seasonal event, or department name</li>
            <li>Keep it short, clear, and recognizable for recipients</li>
            <li>Don&apos;t worry — you can easily change this name later</li>
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
            Collection Preview
          </div>
          <div className="sw-name-preview-imgwrap">
            <img src={collectionPreview} alt="Collection merchandise preview" />
            <div className="sw-name-preview-float">
              <div className="sw-name-preview-icon">
                <Store size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="sw-name-preview-label">{name || "New Collection"}</div>
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
            {NEXT_STEPS.map((step) => (
              <div key={step.title} className="sw-name-next-step">
                <div className="sw-name-next-icon">
                  <step.icon size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink)" }}>
                    {step.title}
                  </div>
                  <div className="mut3" style={{ fontSize: 12, marginTop: 3, lineHeight: 1.4 }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
