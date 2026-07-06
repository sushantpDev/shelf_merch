import { PlatformError, PlatformModal } from "../../../platform-ui";
import { PLATFORM_ROLES, roleLabel } from "../model";
import type { TeamInviteVm } from "../controllers/useTeamInviteController";

/** Team member invite modal. */
export function TeamInviteModalView({
  name,
  email,
  role,
  busy,
  err,
  onClose,
  onName,
  onEmail,
  onRole,
  onSubmit,
}: TeamInviteVm) {
  return (
    <PlatformModal title="Invite team member" onClose={onClose}>
      {err && <PlatformError message={err} />}
      <div className="field">
        <label className="lbl">Name</label>
        <input className="inp" value={name} onChange={(e) => onName(e.target.value)} />
      </div>
      <div className="field">
        <label className="lbl">Email</label>
        <input
          className="inp"
          type="email"
          value={email}
          onChange={(e) => onEmail(e.target.value)}
        />
      </div>
      <div className="field">
        <label className="lbl">Role</label>
        <select className="inp" value={role} onChange={(e) => onRole(e.target.value)}>
          {PLATFORM_ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
      </div>
      <button type="button" className="btn btn-brand btn-block" disabled={busy} onClick={onSubmit}>
        {busy ? "Inviting…" : "Send invite"}
      </button>
    </PlatformModal>
  );
}
