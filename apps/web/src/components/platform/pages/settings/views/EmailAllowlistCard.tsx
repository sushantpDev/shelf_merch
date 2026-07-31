import { PlatformError } from "../../../platform-ui";
import type { EmailAllowlistVm } from "../controllers/useEmailAllowlistController";

/** Super-admin UI for allowlisting personal emails (e.g. Gmail) for testing. */
export function EmailAllowlistCard({
  emails,
  draft,
  busy,
  err,
  canWrite,
  onDraft,
  onAdd,
  onRemove,
}: EmailAllowlistVm) {
  return (
    <div className="card" style={{ padding: 16, marginBottom: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>Test email allowlist</h3>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          Auth requires a work email. Add specific personal addresses (Gmail, etc.) here so they can
          sign up or log in for testing.
        </p>
      </div>

      {err && <PlatformError message={err} />}

      {emails.length === 0 ? (
        <p className="muted" style={{ fontSize: 13, marginBottom: canWrite ? 12 : 0 }}>
          No personal emails allowlisted.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 12px", display: "grid", gap: 8 }}>
          {emails.map((email) => (
            <li
              key={email}
              className="row"
              style={{ justifyContent: "space-between", alignItems: "center", gap: 8 }}
            >
              <code style={{ fontSize: 13 }}>{email}</code>
              {canWrite && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={busy}
                  onClick={() => onRemove(email)}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canWrite && (
        <div className="row" style={{ gap: 8, alignItems: "flex-end" }}>
          <div className="field" style={{ flex: 1, margin: 0 }}>
            <label className="lbl" htmlFor="allowlist-email">
              Email
            </label>
            <input
              id="allowlist-email"
              className="inp"
              type="email"
              placeholder="tester@gmail.com"
              value={draft}
              disabled={busy}
              onChange={(e) => onDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAdd();
                }
              }}
            />
          </div>
          <button type="button" className="btn btn-brand btn-sm" disabled={busy} onClick={onAdd}>
            {busy ? "Saving…" : "Add"}
          </button>
        </div>
      )}
    </div>
  );
}
