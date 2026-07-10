import {
  Box,
  Check,
  Gift,
  Lightbulb,
  Package,
  PenLine,
  Shirt,
  Sparkles,
  Users,
} from "lucide-react";
import kitPreview from "../../../../assets/branded-swag-empty.png";

const EXAMPLES = [
  { label: "Welcome Kit", count: 6, icon: Gift },
  { label: "New Hire Kit", count: 8, icon: Users },
  { label: "Onboarding Box", count: 5, icon: Box },
];

const NEXT_STEPS: { icon: typeof Shirt; title: string; desc: string }[] = [
  {
    icon: Shirt,
    title: "Choose products",
    desc: "Select apparel, drinkware, tech, and more from the catalog.",
  },
  {
    icon: PenLine,
    title: "Brand your kit",
    desc: "Upload your logo and add notes for branded mockups on each item.",
  },
  {
    icon: Package,
    title: "Choose packaging",
    desc: "Pick standard mailers or premium branded boxes for delivery.",
  },
];

/** Kit wizard step 1 — mirrors Swag NameStep layout (form + preview + next steps). */
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
  const trimmed = name.trim();
  const looksGood = trimmed.length >= 4;

  return (
    <div className="sw-name-layout">
      <div className="card sw-name-main-card">
        <header className="sw-name-header">
          <div className="sw-name-title-row">
            <h1>Name your kit</h1>
            <span className="tag tag-ready">Step 1 of 4</span>
          </div>
          <p className="muted sw-name-lead">
            A kit is a reusable bundle of products you can send to recipients at any time. Give it a
            clear name your team will recognize.
          </p>
        </header>

        <div className="sw-name-body">
          <div className="field sw-name-field">
            <label className="lbl" htmlFor="kit-name">
              Kit name
            </label>
            <div className="sw-name-input-container">
              <input
                id="kit-name"
                className="inp"
                value={name}
                maxLength={32}
                autoFocus
                placeholder="e.g. Welcome Kit"
                onChange={(e) => onName(e.target.value)}
              />
            </div>
            <div className="row sw-name-field-meta">
              <span className={looksGood ? "sw-name-ok" : "mut3"}>
                {looksGood ? "Looks good" : "Kit name must be at least 4 characters"}
              </span>
              <span className="mut3">{name.length}/32</span>
            </div>
          </div>

          <div className="field sw-name-field">
            <label className="lbl" htmlFor="kit-desc">
              Internal description{" "}
              <span className="mut3" style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
                (optional)
              </span>
            </label>
            <textarea
              id="kit-desc"
              className="inp"
              rows={3}
              placeholder="e.g. Standard onboarding kit for new joiners"
              value={desc}
              onChange={(e) => onDesc(e.target.value)}
              style={{ resize: "vertical", minHeight: 88, padding: "12px 16px", lineHeight: 1.5 }}
            />
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
                    onClick={() => onName(ex.label)}
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
              <li>Use campaign names, onboarding themes, or seasonal events</li>
              <li>Keep it short and recognizable for recipients and your team</li>
              <li>Don&apos;t worry — you can change the name or contents later</li>
            </ul>
          </div>
        </div>
      </div>

      <aside className="sw-name-aside">
        <div className="card sw-name-preview-card">
          <div className="lbl sw-name-aside-label">Kit preview</div>
          <div className="sw-name-preview-imgwrap">
            <img src={kitPreview} alt="Kit merchandise preview" />
            <div className="sw-name-preview-float">
              <div className="sw-name-preview-icon">
                <Gift size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="sw-name-preview-label">{name.trim() || "Welcome Kit"}</div>
              </div>
            </div>
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
