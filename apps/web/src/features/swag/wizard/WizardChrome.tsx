import { Check } from "lucide-react";
import type { ReactNode } from "react";

/** Full-screen wizard shell: title bar + step indicator + scroll body + footer. */
export function WizardChrome({
  title,
  steps,
  activeIndex,
  onExit,
  exitLabel = "Save and exit",
  footer,
  children,
}: {
  title: string;
  steps: string[];
  activeIndex: number;
  onExit: () => void;
  exitLabel?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="sm-fullscreen" style={{ background: "var(--bg)" }}>
      <div className="wzbar">
        <div className="title">{title}</div>
        <div className="wzsteps">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`wzstep ${i < activeIndex ? "done" : ""} ${i === activeIndex ? "on" : ""}`}
            >
              <span className="b">{i < activeIndex ? <Check size={12} /> : i + 1}</span>
              {s}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="lnk"
          style={{ background: "none", border: "none", cursor: "pointer" }}
          onClick={onExit}
        >
          {exitLabel}
        </button>
      </div>
      <div className="main scroll" style={{ flex: 1 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: 34 }} className="fade-in">
          {children}
        </div>
      </div>
      {footer && <div className="wzfoot">{footer}</div>}
    </div>
  );
}
