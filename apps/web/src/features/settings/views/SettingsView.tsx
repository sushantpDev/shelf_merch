import { useRef } from "react";
import { LogOut, Upload } from "lucide-react";
import { PageHeader } from "@/components/tenant/PageHeader";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { SettingsVm } from "../controllers/useSettingsController";
import { TransferOwnershipDialog } from "../TransferOwnershipDialog";

/** Settings screen: side tabs + workspace form or SSO instructions. */
export function SettingsView(vm: SettingsVm) {
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage your workspace, ownership, currency and single sign-on."
        actions={
          <button type="button" className="btn btn-ghost" onClick={vm.onLogout}>
            <LogOut size={16} /> Log out
          </button>
        }
      />
      <div style={{ display: "flex", gap: 22 }}>
        <div className="subrail" role="tablist" aria-label="Settings sections">
          {(
            [
              ["workspace", "Workspace settings"],
              ["sso", "SSO"],
            ] as const
          ).map(([key, label]) => (
            <button
              type="button"
              key={key}
              role="tab"
              aria-selected={vm.tab === key}
              className={`item${vm.tab === key ? " on" : ""}`}
              onClick={() => vm.onTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, maxWidth: 780 }}>
          {vm.tab === "workspace" ? <WorkspaceSettingsView {...vm} /> : <SsoSettingsView {...vm} />}
        </div>
      </div>
    </>
  );
}

function WorkspaceSettingsView(vm: SettingsVm) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="card" style={{ padding: 30 }}>
      <h2 style={{ fontSize: 23, fontFamily: "var(--disp)", marginBottom: 22 }}>
        Workspace Settings
      </h2>

      <div className="field" style={{ maxWidth: 440 }}>
        <label className="lbl" htmlFor="ws-name">
          Workspace name
        </label>
        <input
          id="ws-name"
          className="inp"
          value={vm.name}
          onChange={(e) => vm.onName(e.target.value)}
          readOnly={!vm.canEditWorkspace}
        />
      </div>

      <div className="divider" />

      <div className="lbl">Workspace icon</div>
      <p className="muted" style={{ fontSize: 13, margin: "4px 0 12px" }}>
        This will be used as the company icon for the workspace on all members' profiles.
      </p>
      <div className="row" style={{ gap: 14, alignItems: "center" }}>
        <div
          className="logo-chip"
          style={{
            width: 50,
            height: 50,
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
            padding: vm.logoUrl ? 5 : 0,
          }}
        >
          {vm.logoUrl ? (
            <img
              src={resolveMediaUrl(vm.logoUrl)}
              alt="Workspace icon"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : (
            <svg viewBox="0 0 32 32" fill="none" width={26} height={26} aria-hidden="true">
              <path d="M16 3 4 9l12 6 12-6-12-6Z" fill="#15784C" />
              <path d="M4 15l12 6 12-6" stroke="#0E5536" strokeWidth="2.4" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        {vm.canEditWorkspace ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={vm.isUploading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={15} /> {vm.isUploading ? "Uploading..." : "Upload"}
          </button>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept=".svg,.png,.webp,.jpeg,.jpg,image/svg+xml,image/png,image/webp,image/jpeg"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) vm.onPickLogo(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="divider" />

      <div className="lbl">Owner</div>
      <div
        className="row"
        style={{ gap: 18, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}
      >
        {vm.displayOwner ? (
          <div style={{ fontSize: 14 }}>
            <b>{vm.displayOwner.name}</b>
            {vm.displayOwner.email ? (
              <>
                {" "}
                &nbsp;<span className="muted">{vm.displayOwner.email}</span>
              </>
            ) : null}
          </div>
        ) : (
          <span className="muted" style={{ fontSize: 14 }}>
            No owner assigned
          </span>
        )}
        {vm.isCurrentOwner && vm.displayOwner && vm.canEditWorkspace ? (
          <button type="button" className="lnk" onClick={() => vm.onTransferOpenChange(true)}>
            Transfer ownership ↗
          </button>
        ) : null}
      </div>

      {vm.displayOwner && vm.isCurrentOwner ? (
        <TransferOwnershipDialog
          open={vm.transferOpen}
          onOpenChange={vm.onTransferOpenChange}
          currentOwner={vm.displayOwner}
        />
      ) : null}

      <div className="divider" />

      <div className="lbl">Workspace currency</div>
      <p className="muted" style={{ fontSize: 13, margin: "4px 0 10px" }}>
        This will be used as the default currency for the main workspace wallet or any refunds.
      </p>
      <div className="row" style={{ gap: 14, alignItems: "center" }}>
        <b style={{ fontSize: 15 }}>INR</b>
        <button type="button" className="lnk" onClick={vm.onChangeCurrency}>
          Change ↗
        </button>
      </div>

      <div className="divider" />

      <div className="lbl">Workspace URL</div>
      <div className="row" style={{ gap: 8, alignItems: "center", marginTop: 8 }}>
        <span className="muted" style={{ fontSize: 14 }}>
          app.shelfmerch.io/
        </span>
        <input
          aria-label="Workspace URL slug"
          className="inp"
          value={vm.slug}
          onChange={(e) => vm.onSlug(e.target.value)}
          readOnly={!vm.canEditWorkspace}
          style={{ maxWidth: 320 }}
        />
      </div>

      {vm.canEditWorkspace ? (
        <div style={{ marginTop: 24 }}>
          <button
            type="button"
            className="btn btn-brand"
            disabled={vm.isSaving || vm.isUploading}
            onClick={vm.onSave}
          >
            {vm.isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SsoSettingsView(vm: SettingsVm) {
  return (
    <div className="card" style={{ padding: 30 }}>
      <h2 style={{ fontSize: 23, fontFamily: "var(--disp)", marginBottom: 14 }}>SSO</h2>
      <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
        Enable SSO on Shelf Merch for a faster, more secure login. Available for enterprise packages
        or as an add-on.{" "}
        <button type="button" className="lnk" onClick={vm.onSsoLearnMore}>
          Learn more
        </button>
      </p>
      <ol
        style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.7, color: "var(--ink)" }}
      >
        <li style={{ marginBottom: 12 }}>
          Find our metadata at{" "}
          <a
            className="lnk"
            href="https://account.shelfmerch.io/saml/metadata"
            target="_blank"
            rel="noreferrer"
          >
            https://account.shelfmerch.io/saml/metadata
          </a>
        </li>
        <li style={{ marginBottom: 12 }}>
          Create a custom SSO app on your IdP (Okta, Azure, etc.) using the ACS URL, Entity ID,
          Certificate and Attributes listed in the metadata above.
        </li>
        <li style={{ marginBottom: 12 }}>
          Once the app setup is done, email <b>sso@shelfmerch.io</b> with the following details:
          <ul style={{ margin: "8px 0 0", paddingLeft: 20, color: "var(--ink-2)" }}>
            <li>Single Sign-On URL</li>
            <li>Single Logout URL (optional)</li>
            <li>Entity ID</li>
            <li>Certificate</li>
          </ul>
        </li>
        <li>
          Leave everything else to us. After we receive the above details, we'll create a
          corresponding configuration in our backend to enable SSO. This process typically takes{" "}
          <b>4–6 business days</b> to configure and test. Once SSO is enabled for your email domain,
          all users on the same email domain will be redirected to your IdP immediately.
        </li>
      </ol>
      <p className="muted" style={{ fontSize: 13.5, marginTop: 20 }}>
        For any further queries, please{" "}
        <button type="button" className="lnk" onClick={vm.onSsoContact}>
          contact us
        </button>
        .
      </p>
    </div>
  );
}
