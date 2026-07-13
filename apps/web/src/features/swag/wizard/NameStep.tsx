import { Box, Check, Gift, Lightbulb, Pencil, Sparkles, Store, Sun, Users } from "lucide-react";
import collectionPreview from "../../../../assets/collection-preview.png";

const EXAMPLES = [
  { label: "Welcome kit", count: 6, icon: Gift },
  { label: "Summer swag", count: 4, icon: Sun },
  { label: "Team essentials", count: 8, icon: Users },
];
const NEXT_STEPS: { icon: typeof Box; title: string; desc: string }[] = [
  {
    icon: Box,
    title: "Choose products",
    desc: "Select apparel, bags, drinkware, or technology items from the catalog.",
  },
  {
    icon: Pencil,
    title: "Add artwork",
    desc: "Position your logo and design elements directly on items in real-time.",
  },
  {
    icon: Store,
    title: "Publish collection",
    desc: "Make it live instantly in your department or corporate merchandise store.",
  },
];

export function NameStep({
  name,
  onChange,
  shopName,
}: {
  name: string;
  onChange: (name: string) => void;
  shopName?: string;
}) {
  const trimmed = name.trim();
  const looksGood = trimmed.length > 0;

  return (
    <div className="sw-name-layout">
      <div className="card sw-name-main-card">
        <header className="sw-name-header">
          <div className="sw-name-title-row">
            <h1>Name your collection</h1>
            <span className="tag tag-ready">Step 1 of 3</span>
          </div>
          <p className="muted sw-name-lead">
            Create a collection for your brand store. Give it a clear name so employees or
            customers can easily recognize it.
          </p>
          {shopName ? (
            <p className="muted sw-name-shop">
              Creating for <b>{shopName}</b>
            </p>
          ) : null}
        </header>

        <div className="sw-name-body">
          <div className="field sw-name-field">
            <label className="lbl" htmlFor="sw-name">
              Collection name
            </label>
            <div className="sw-name-input-container">
              <input
                id="sw-name"
                className="inp"
                value={name}
                maxLength={32}
                autoFocus
                placeholder="e.g. Welcome Kit"
                onChange={(e) => onChange(e.target.value)}
              />
            </div>
            <div className="row sw-name-field-meta">
              <span className={looksGood ? "sw-name-ok" : "mut3"}>
                {looksGood ? "Looks good" : "Enter a collection name"}
              </span>
              <span className="mut3">{name.length}/32</span>
            </div>
          </div>

          <div className="sw-name-suggest-block">
            <div className="sw-name-suggest-head">
              <div className="sw-name-suggest-intro">
                <span className="sw-name-suggest-badge">
                  <Sparkles size={14} />
                </span>
                <div>
                  <div className="sw-name-suggest-label">Quick picks</div>
                </div>
              </div>
              <span className="mut3 sw-name-suggest-hint">Click a card to use</span>
            </div>
            <div className="sw-name-pick-grid">
              {EXAMPLES.map((ex) => {
                const selected = name === ex.label;
                const Icon = ex.icon;
                return (
                  <button
                    key={ex.label}
                    type="button"
                    className={`sw-name-pick-card${selected ? " on" : ""}`}
                    onClick={() => onChange(ex.label)}
                  >
                    {selected ? (
                      <span className="sw-name-pick-check">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    ) : null}
                    <span className="sw-name-pick-icon">
                      <Icon size={15} strokeWidth={2} />
                    </span>
                    <span className="sw-name-pick-copy">
                      <span className="sw-name-pick-title">{ex.label}</span>
                      <span className="sw-name-pick-count">{ex.count} items</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sw-name-tips">
            <div className="row sw-name-tips-head">
              <Lightbulb size={15} /> Naming best practices
            </div>
            <ul className="sw-name-tips-list">
              <li>Use your campaign name, seasonal event, or department name</li>
              <li>Keep it short, clear, and recognizable for recipients</li>
              <li>Don&apos;t worry, you can easily change this name later</li>
            </ul>
          </div>
        </div>
      </div>

      <aside className="sw-name-aside">
        <div className="card sw-name-preview-card">
          <div className="lbl sw-name-aside-label">Collection preview</div>
          <div className="sw-name-preview-imgwrap">
            <img src={collectionPreview} alt="Branded merchandise preview" />
          </div>
        </div>

        <div className="card sw-name-next-card">
          <div className="lbl sw-name-aside-label">Next steps</div>
          <div className="sw-name-next-steps">
            {NEXT_STEPS.map((step, i) => (
              <div key={step.title} className="sw-name-next-step">
                <div className="sw-name-next-icon">
                  <step.icon size={15} />
                </div>
                <div>
                  <div className="sw-name-next-title">
                    {i + 1}. {step.title}
                  </div>
                  <div className="mut3 sw-name-next-desc">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
