import { type ReactNode } from "react";
import { Box, Check, Send, Store, Users, Wallet } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { inr } from "@/components/platform/platform-ui";
import { selectedDepartments, type WizardState } from "../types";

function StatusTag({ label, tone = "live" }: { label: string; tone?: "live" | "warn" }) {
  return (
    <span className={tone === "warn" ? "tag tag-warn" : "tag tag-live"}>
      {tone === "live" ? <span className="dot" /> : null}
      {label}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  meta,
  tag,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  meta: string;
  tag?: ReactNode;
}) {
  return (
    <div className="wallet-done-stat">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="wallet-done-stat__icon">{icon}</div>
        {tag}
      </div>
      <div className="wallet-done-stat__label">{label}</div>
      <div className="wallet-done-stat__value num">{value}</div>
      <div className="wallet-done-stat__meta">{meta}</div>
    </div>
  );
}

/** Success screen after wallet create or allocate-funds wizard. */
export function OrgDoneScreen({
  account,
  state,
  onGoToDashboard,
}: {
  account: string;
  state: WizardState;
  onGoToDashboard: () => void;
}) {
  const o = state.wallet;
  const isWalletFlow = state.flow === "wallet";
  const depts = selectedDepartments(state.departments);
  const invited = depts.filter((d) => d.mgr.invite && d.mgr.email).length;
  const inviteLinks = state.sentInvites.filter((i) => i.inviteToken);
  const totalAllocated = depts.reduce((sum, d) => sum + (d.allocated || 0), 0);

  function copyInvite(token: string) {
    const link = `${location.origin}/accept-invite?token=${encodeURIComponent(token)}`;
    navigator.clipboard?.writeText(link).then(
      () => toast.success("Invite link copied"),
      () => toast.error("Could not copy link"),
    );
  }

  if (isWalletFlow) {
    return (
      <div className="wallet-done fade-in">
        <header className="wallet-done-hero">
          <div className="wallet-done-hero__icon" aria-hidden="true">
            <Check />
          </div>
          <div>
            <h1>Wallet submitted for review</h1>
            <p>
              Platform finance will review your PO. Once approved, {inr(o.amount)} will be credited
              to <strong>{o.name}</strong> and you can allocate funds to departments.
            </p>
          </div>
        </header>

        <div className="wallet-done-actions" style={{ maxWidth: 320, marginTop: 24 }}>
          <button type="button" className="btn btn-brand btn-lg" onClick={onGoToDashboard}>
            Go to wallet dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-done fade-in">
      <header className="wallet-done-hero">
        <div className="wallet-done-hero__icon" aria-hidden="true">
          <Check />
        </div>
        <div>
          <h1>Allocation complete</h1>
          <p>
            Your wallet budget is split across {depts.length} department
            {depts.length === 1 ? "" : "s"}. <strong>{account}</strong> is ready to launch
            campaigns.
          </p>
        </div>
      </header>

      <div className="wallet-done-grid">
        <div>
          <div className="wallet-done-stats">
            <StatCard
              icon={<Wallet size={18} />}
              label="Wallet budget"
              value={inr(o.amount)}
              meta={o.name}
              tag={<StatusTag label="Active" />}
            />
            <StatCard
              icon={<Box size={18} />}
              label="Allocated"
              value={inr(totalAllocated)}
              meta={`Across ${depts.length} department${depts.length === 1 ? "" : "s"}`}
              tag={<StatusTag label="Done" />}
            />
            <StatCard
              icon={<Users size={18} />}
              label="Managers"
              value={String(invited)}
              meta={
                invited
                  ? "Invitation emails sent — check spam if not received"
                  : "No manager invites sent"
              }
              tag={invited > 0 ? <StatusTag label="Sent" /> : undefined}
            />
          </div>

          {depts.length > 0 && (
            <div className="wallet-done-panel card">
              <div className="wallet-done-panel__head">Department breakdown</div>
              {depts.map((d) => (
                <div key={String(d.id)} className="wallet-done-dept">
                  <div className="wallet-done-dept__name">
                    <span className="wallet-done-dept__sw" style={{ background: d.color }} />
                    {d.name}
                  </div>
                  <div className="num">{inr(d.allocated)}</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>
                    {d.mgr.name || d.mgr.email || "Manager not assigned"}
                  </div>
                  <div>
                    {d.mgr.invite && d.mgr.email ? (
                      <StatusTag label="Invited" />
                    ) : (
                      <span className="tag tag-draft">No invite</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {inviteLinks.length > 0 && (
            <div className="wallet-done-panel card" style={{ marginTop: 18 }}>
              <div className="wallet-done-panel__head">Invite links (dev)</div>
              <div className="wallet-done-invites">
                <p className="mut3" style={{ fontSize: 12, margin: "0 0 12px" }}>
                  Gmail often filters localhost invite links to spam. Share these links directly if
                  needed.
                </p>
                {inviteLinks.map((i) => (
                  <div key={i.inviteToken} className="wallet-done-invite">
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                      {i.name || i.email} · {i.entityName}
                    </div>
                    <div className="mut3" style={{ fontSize: 11.5, wordBreak: "break-all" }}>
                      {`${location.origin}/accept-invite?token=${i.inviteToken}`}
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ marginTop: 8 }}
                      onClick={() => copyInvite(i.inviteToken!)}
                    >
                      Copy invite link
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="wallet-done-aside">
          <div className="wallet-done-next">
            <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
              <div className="logo-chip" style={{ width: 40, height: 40, flex: "none" }}>
                <Store size={20} color="#15784C" />
              </div>
              <div>
                <div className="wallet-done-next__k">Recommended next step</div>
                <div className="wallet-done-next__title">Create your company store</div>
                <p className="wallet-done-next__body">
                  Set up a storefront so departments can send kits, points, and gifts to
                  recipients.
                </p>
              </div>
            </div>
          </div>

          <div className="wallet-done-actions">
            <Link to="/app/shops/new" className="btn btn-brand btn-lg">
              Create store <Send size={15} />
            </Link>
            <button type="button" className="btn btn-ghost btn-lg" onClick={onGoToDashboard}>
              Go to wallet dashboard
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
