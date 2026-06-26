import { Lightbulb } from "lucide-react";

const EXAMPLES = ["Welcome Kit", "Summer Swag", "Team Essentials"];

export function NameStep({ name, onChange }: { name: string; onChange: (name: string) => void }) {
  return (
    <div style={{ maxWidth: 560 }}>
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
        Create a collection for your brand store. Give it a clear name so employees or customers can
        easily recognize it.
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
  );
}
