import { useEffect, useRef, useState } from "react";
import { LogOut, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/tenant/PageHeader";
import { useInvalidateWorkspace, useWorkspace } from "@/hooks/useWorkspace";
import { logout } from "@/services/api-bridge";
import { getStoredUser } from "@/services/auth-store";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import {
  updateWorkspaceSettingsApi,
  uploadWorkspaceLogoApi,
  type WorkspaceOwner,
} from "@/services/workspace-api";
import { TransferOwnershipDialog } from "./TransferOwnershipDialog";

type Tab = "workspace" | "sso";

const LOGO_ACCEPT = /\.(svg|png|webp|jpe?g)$/i;
const LOGO_MAX = 5 * 1024 * 1024;

export function SettingsPage() {
  const { data: workspace } = useWorkspace();
  const [tab, setTab] = useState<Tab>("workspace");

  async function onLogout() {
    await logout().catch(() => {});
    window.location.href = "/login";
  }

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage your workspace, ownership, currency and single sign-on."
        actions={
          <button type="button" className="btn btn-ghost" onClick={onLogout}>
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
              aria-selected={tab === key}
              className={`item${tab === key ? " on" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, maxWidth: 780 }}>
          {tab === "workspace" ? (
            <WorkspaceSettings
              account={workspace?.account ?? ""}
              logoUrl={workspace?.logoUrl ?? ""}
              owner={workspace?.owner}
              userId={getStoredUser()?.id}
              userPatch={workspace?.userPatch}
            />
          ) : (
            <SsoSettings />
          )}
        </div>
      </div>
    </>
  );
}

function WorkspaceSettings({
  account,
  logoUrl: savedLogoUrl,
  owner,
  userId,
  userPatch,
}: {
  account: string;
  logoUrl: string;
  owner?: WorkspaceOwner;
  userId?: string;
  userPatch?: { name: string; email: string };
}) {
  const invalidateWorkspace = useInvalidateWorkspace();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(account);
  const [logoUrl, setLogoUrl] = useState(savedLogoUrl);
  const [slug, setSlug] = useState(account.toLowerCase());
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const displayOwner: WorkspaceOwner | undefined =
    owner ??
    (userId && userPatch
      ? { id: userId, name: userPatch.name, email: userPatch.email }
      : undefined);
  const isCurrentOwner = Boolean(displayOwner && userId && displayOwner.id === userId);

  // Keep local fields in sync once the workspace snapshot resolves.
  useEffect(() => {
    setName(account);
    setSlug(account.toLowerCase());
    setLogoUrl(savedLogoUrl);
  }, [account, savedLogoUrl]);

  async function onPickLogo(file: File) {
    if (!LOGO_ACCEPT.test(file.name)) {
      toast.error("Accepted formats: SVG, PNG, WEBP, JPEG, JPG");
      return;
    }
    if (file.size > LOGO_MAX) {
      toast.error("File must be 5 MB or smaller");
      return;
    }

    setIsUploading(true);
    try {
      const uploadedLogoUrl = await uploadWorkspaceLogoApi(file);
      await updateWorkspaceSettingsApi({ logoUrl: uploadedLogoUrl });
      setLogoUrl(uploadedLogoUrl);
      await invalidateWorkspace();
      toast.success("Workspace icon updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update workspace icon");
    } finally {
      setIsUploading(false);
    }
  }

  async function onSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Enter a workspace name");
      return;
    }

    setIsSaving(true);
    try {
      await updateWorkspaceSettingsApi({ name: trimmedName, logoUrl });
      setName(trimmedName);
      await invalidateWorkspace();
      toast.success("Workspace settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save workspace settings");
    } finally {
      setIsSaving(false);
    }
  }

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
          value={name}
          onChange={(e) => setName(e.target.value)}
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
            padding: logoUrl ? 5 : 0,
          }}
        >
          {logoUrl ? (
            <img
              src={resolveMediaUrl(logoUrl)}
              alt="Workspace icon"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : (
            <svg viewBox="0 0 32 32" fill="none" width={26} height={26} aria-hidden="true">
              <path d="M16 3 4 9l12 6 12-6-12-6Z" fill="#15784C" />
              <path
                d="M4 15l12 6 12-6"
                stroke="#0E5536"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={isUploading}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={15} /> {isUploading ? "Uploading..." : "Upload"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".svg,.png,.webp,.jpeg,.jpg,image/svg+xml,image/png,image/webp,image/jpeg"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onPickLogo(file);
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
        {displayOwner ? (
          <div style={{ fontSize: 14 }}>
            <b>{displayOwner.name}</b>
            {displayOwner.email ? (
              <>
                {" "}
                &nbsp;<span className="muted">{displayOwner.email}</span>
              </>
            ) : null}
          </div>
        ) : (
          <span className="muted" style={{ fontSize: 14 }}>
            No owner assigned
          </span>
        )}
        {isCurrentOwner && displayOwner ? (
          <button type="button" className="lnk" onClick={() => setTransferOpen(true)}>
            Transfer ownership ↗
          </button>
        ) : null}
      </div>

      {displayOwner && isCurrentOwner ? (
        <TransferOwnershipDialog
          open={transferOpen}
          onOpenChange={setTransferOpen}
          currentOwner={displayOwner}
        />
      ) : null}

      <div className="divider" />

      <div className="lbl">Workspace currency</div>
      <p className="muted" style={{ fontSize: 13, margin: "4px 0 10px" }}>
        This will be used as the default currency for the main workspace wallet or any refunds.
      </p>
      <div className="row" style={{ gap: 14, alignItems: "center" }}>
        <b style={{ fontSize: 15 }}>INR</b>
        <button type="button" className="lnk" onClick={() => toast("Change currency")}>
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
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          style={{ maxWidth: 320 }}
        />
      </div>

      <div style={{ marginTop: 24 }}>
        <button
          type="button"
          className="btn btn-brand"
          disabled={isSaving || isUploading}
          onClick={onSave}
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function SsoSettings() {
  return (
    <div className="card" style={{ padding: 30 }}>
      <h2 style={{ fontSize: 23, fontFamily: "var(--disp)", marginBottom: 14 }}>SSO</h2>
      <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
        Enable SSO on Shelf Merch for a faster, more secure login. Available for enterprise packages
        or as an add-on.{" "}
        <button type="button" className="lnk" onClick={() => toast("SSO docs opened")}>
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
        <button type="button" className="lnk" onClick={() => toast("Support contacted")}>
          contact us
        </button>
        .
      </p>
    </div>
  );
}
