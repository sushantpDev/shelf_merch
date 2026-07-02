import { BarChart3, Box, LayoutGrid, ShieldCheck, Star, Users } from "lucide-react";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import megaphoneBox from "../../../assets/megaphone_box.png";

/** Campaigns page with no campaigns yet: hero + "ways to get started" + "why". */
export function CampaignsEmptyState({ onSendGift }: { onSendGift: () => void }) {
  const { canOperateCampaigns } = useTenantAccess();
  const canSend = canOperateCampaigns();

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Campaigns</h1>
          <div className="sub">Launch points campaigns and track redemptions.</div>
        </div>
        {canSend ? (
          <button type="button" className="btn btn-dark" onClick={onSendGift}>
            Send Gift
          </button>
        ) : null}
      </div>

      <div className="card camp-empty-card">
        <img
          src={megaphoneBox}
          alt="No campaigns yet"
          className="megaphone-illustration"
          style={{ width: "20%", height: "auto", display: "block" }}
        />
        <h3 className="camp-empty-title">No campaigns yet</h3>
        <p className="camp-empty-desc">
          Create a campaign from a shop or set a budget to send redemption invites.
        </p>
        {canSend ? (
          <button
            type="button"
            className="btn btn-brand"
            style={{ marginTop: 14 }}
            onClick={onSendGift}
          >
            Create your first campaign
          </button>
        ) : (
          <p className="muted" style={{ marginTop: 14 }}>
            Your company admin sets up shops and kits; you can launch campaigns from here once
            assigned as a department manager.
          </p>
        )}
      </div>

      {canSend ? (
      <div className="camp-ways">
        <h2 className="camp-section-title">Ways to get started</h2>
        <div className="camp-ways-grid">
          <div className="card camp-way-card">
            <div
              className="camp-way-icon"
              style={{ background: "var(--brand-50)", color: "var(--brand)" }}
            >
              <LayoutGrid size={20} />
            </div>
            <div className="camp-way-body">
              <h3>Send a gift</h3>
              <p>Let recipients choose their own swag from your branded shop.</p>
              <button type="button" className="camp-way-link" onClick={onSendGift}>
                Send points campaign →
              </button>
            </div>
          </div>
          <div className="card camp-way-card">
            <div
              className="camp-way-icon"
              style={{ background: "var(--brand-50)", color: "var(--brand)" }}
            >
              <Box size={20} />
            </div>
            <div className="camp-way-body">
              <h3>Send a kit</h3>
              <p>Ship a curated bundle of branded items to recipients.</p>
              <button type="button" className="camp-way-link" onClick={onSendGift}>
                Send kit campaign →
              </button>
            </div>
          </div>
          <div className="card camp-way-card camp-way-light-bg">
            <div className="camp-way-icon" style={{ background: "#fff", color: "var(--brand)" }}>
              <Star size={20} />
            </div>
            <div className="camp-way-body">
              <h3>New to campaigns?</h3>
              <p>Launch, track and optimize your employee gifting in just a few steps.</p>
              <button type="button" className="camp-way-link" onClick={onSendGift}>
                View quick guide →
              </button>
            </div>
          </div>
        </div>
      </div>
      ) : null}

      <div className="camp-why">
        <h2 className="camp-section-title">Why use campaigns?</h2>
        <div className="card camp-why-card-container">
          <div className="camp-why-item">
            <div className="camp-why-icon">
              <Users size={20} />
            </div>
            <div>
              <h3>Reach more people</h3>
              <p>Send to one or many recipients instantly.</p>
            </div>
          </div>
          <div className="camp-why-divider" />
          <div className="camp-why-item">
            <div className="camp-why-icon">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3>Track performance</h3>
              <p>Monitor redemptions and campaign performance.</p>
            </div>
          </div>
          <div className="camp-why-divider" />
          <div className="camp-why-item">
            <div className="camp-why-icon">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3>Drive engagement</h3>
              <p>Celebrate moments and boost employee satisfaction.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
