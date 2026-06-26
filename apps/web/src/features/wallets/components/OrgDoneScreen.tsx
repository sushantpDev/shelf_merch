import { Box, Check, Send, Store, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { inr } from "@/components/platform/platform-ui";
import type { WizardState } from "../types";

/** Success screen after finishing organization setup. */
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
  const depts = state.departments;
  const invited = depts.filter((d) => d.mgr.invite && d.mgr.email).length;
  const inviteLinks = state.sentInvites.filter((i) => i.inviteToken);

  function copyInvite(token: string) {
    const link = `${location.origin}/accept-invite?token=${encodeURIComponent(token)}`;
    navigator.clipboard?.writeText(link).then(
      () => toast.success("Invite link copied"),
      () => toast.error("Could not copy link"),
    );
  }

  return (
    <div style={{ maxWidth: 620, margin: "30px auto", textAlign: "center" }}>
      <div className="success-burst" aria-hidden="true">
        <Check size={36} />
      </div>
      <h1 style={{ fontSize: 26 }}>Organization setup complete</h1>
      <p className="muted" style={{ margin: "8px 0 24px" }}>
        Your merchandise program is live. {account} is ready to launch its first company store.
      </p>

      <div className="card" style={{ padding: "8px 20px", textAlign: "left" }}>
        <div className="succ-item">
          <div className="si">
            <Wallet size={17} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Wallet created</div>
            <div className="mut3" style={{ fontSize: 12 }}>
              {inr(o.amount)} budget activated
            </div>
          </div>
          <span className="tag tag-live">
            <span className="dot" />
            Active
          </span>
        </div>
        <div className="succ-item">
          <div className="si">
            <Box size={17} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{depts.length} departments created</div>
            <div className="mut3" style={{ fontSize: 12 }}>
              {depts.map((d) => d.name).join(", ")}
            </div>
          </div>
          <span className="tag tag-live">
            <span className="dot" />
            Done
          </span>
        </div>
        <div className="succ-item" style={{ borderBottom: "none" }}>
          <div className="si">
            <Users size={17} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{invited} managers invited</div>
            <div className="mut3" style={{ fontSize: 12 }}>
              Invitations sent via email — check spam if not received
            </div>
          </div>
          <span className="tag tag-live">
            <span className="dot" />
            Sent
          </span>
        </div>
      </div>

      {inviteLinks.length > 0 && (
        <div className="card" style={{ padding: "8px 20px", marginTop: 16, textAlign: "left" }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Invite links (dev)</div>
          <p className="mut3" style={{ fontSize: 12, margin: "0 0 12px" }}>
            Gmail often filters localhost invite links to spam. Share these links directly if
            needed.
          </p>
          {inviteLinks.map((i) => (
            <div
              key={i.inviteToken}
              className="succ-item"
              style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {i.name || i.email} · {i.entityName}
              </div>
              <div className="mut3" style={{ fontSize: 11.5, wordBreak: "break-all" }}>
                {`${location.origin}/accept-invite?token=${i.inviteToken}`}
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => copyInvite(i.inviteToken!)}
              >
                Copy invite link
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className="card"
        style={{
          padding: "14px 18px",
          marginTop: 16,
          display: "flex",
          gap: 12,
          alignItems: "center",
          textAlign: "left",
          background: "var(--brand-50)",
          borderColor: "#cfe7da",
        }}
      >
        <div className="logo-chip" style={{ width: 36, height: 36 }}>
          <Store size={18} color="#15784C" />
        </div>
        <div>
          <div
            className="mut3"
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".04em",
            }}
          >
            Recommended next step
          </div>
          <div style={{ fontWeight: 600 }}>Create your company store</div>
        </div>
      </div>

      <div className="row" style={{ justifyContent: "center", marginTop: 22 }}>
        <button type="button" className="btn btn-ghost btn-lg" onClick={onGoToDashboard}>
          Go to dashboard
        </button>
        <a className="btn btn-brand btn-lg" href="/?view=shops">
          Create store <Send size={15} />
        </a>
      </div>
    </div>
  );
}
