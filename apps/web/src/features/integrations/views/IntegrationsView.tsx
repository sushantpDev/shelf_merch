import { LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";
import {
  COLLABORATION_TOOLS,
  DISPLAY_TOOLS,
  USER_MANAGEMENT_TOOLS,
  asTile,
  type Integration,
  type Tile,
} from "../data";
import type { IntegrationsVm } from "../controllers/useIntegrationsController";
import { IntegrationDetailView, IntegrationMark } from "./IntegrationDetailView";

function IntegrationTile({
  item,
  detail = false,
  onSelect,
}: {
  item: Tile | Integration;
  detail?: boolean;
  onSelect: (tile: Tile) => void;
}) {
  const tile = asTile(item);

  return (
    <button
      type="button"
      className={`bonus-integ-tile${detail ? " bonus-integ-tile--detail" : ""}`}
      onClick={() => onSelect(tile)}
    >
      {(tile.icon || tile.mark) && (
        <span className="bonus-integ-logo" aria-hidden="true">
          {tile.icon ? (
            <img src={tile.icon} alt="" />
          ) : (
            <span style={{ background: tile.tone }}>{tile.mark}</span>
          )}
        </span>
      )}
      <span className="bonus-integ-copy">
        <span className="bonus-integ-name">{tile.name}</span>
        {tile.recommended && <span className="bonus-integ-recommended">Recommended</span>}
        {detail && tile.desc && <span className="bonus-integ-desc">{tile.desc}</span>}
      </span>
    </button>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <section className="bonus-integ-section">
      <h2>{title}</h2>
      <p>{desc}</p>
      {children}
    </section>
  );
}

/** Integrations screen: tile grid sections, or the selected tile's detail page. */
export function IntegrationsView(vm: IntegrationsVm) {
  if (vm.selected) {
    return (
      <IntegrationDetailView
        tile={vm.selected}
        onBack={vm.onBack}
        onInstall={vm.onInstall}
        onSupport={vm.onSupport}
      />
    );
  }

  return (
    <div className="bonus-integ-page">
      <h1>Integrations</h1>

      <Section
        title="Collaboration tools"
        desc="Connect ShelfMerch to your existing chat or workflow tools so your team can see gifting updates where they work."
      >
        <div className="bonus-integ-grid bonus-integ-grid--compact">
          {COLLABORATION_TOOLS.map((item) => (
            <IntegrationTile item={item} key={item.id} onSelect={vm.onSelect} />
          ))}
        </div>
      </Section>

      <Section
        title="User management"
        desc="Connect your HRIS or HRMS software to automatically sync user information, including employee names, emails, and more."
      >
        <div className="bonus-integ-grid bonus-integ-grid--detail">
          {USER_MANAGEMENT_TOOLS.map((item) => (
            <IntegrationTile detail item={item} key={item.id} onSelect={vm.onSelect} />
          ))}
        </div>
      </Section>

      <Section
        title="Single sign-on"
        desc="Enable single sign-on (SSO) to protect your company's account information."
      >
        <div className="bonus-integ-plan">
          <div className="bonus-integ-plan-h">
            <LockKeyhole size={17} aria-hidden="true" />
            <h3>Single Sign-On (SSO)</h3>
          </div>
          <p>
            Configure SAML-based Single Sign-On to let your team sign in to ShelfMerch using your
            identity provider.
          </p>
          <strong>Available on the Enterprise plan</strong>
          <button type="button" onClick={vm.onViewPlans}>
            View plans
          </button>
        </div>
      </Section>

      <Section
        title="ShelfMerch display"
        desc="Maximize the impact of gifting across the tools your employees already use."
      >
        <div className="bonus-integ-grid bonus-integ-grid--detail">
          {DISPLAY_TOOLS.map((item) => (
            <IntegrationTile detail item={item} key={item.id} onSelect={vm.onSelect} />
          ))}
        </div>
      </Section>
    </div>
  );
}
