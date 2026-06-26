import { useEffect, type ComponentType } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  CreditCard,
  Gift,
  LayoutGrid,
  Megaphone,
  Plug,
  Receipt,
  Settings,
  Shirt,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { getStoredUser, isAuthenticated, logout } from "@/services/api-bridge";
import { useWorkspace } from "@/hooks/useWorkspace";
import "@/styles/shelf-merch.css";

/**
 * Tenant navigation. `migrated` flips to true as each feature is ported to
 * React; migrated items link to `/app/*`, the rest deep-link back to the legacy
 * engine at `/?view=<key>` until they are cut over. This list is the single
 * source of truth for the cutover.
 */
type NavItem = {
  key: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  migrated: boolean;
};

const NAV: NavItem[] = [
  { key: "orders", label: "Orders", icon: Receipt, migrated: true },
  { key: "wallets", label: "Wallets", icon: Wallet, migrated: true },
  { key: "shops", label: "Shops", icon: Store, migrated: true },
  { key: "swag", label: "Swag", icon: Shirt, migrated: false },
  { key: "kits", label: "Kits", icon: Gift, migrated: false },
  { key: "campaigns", label: "Campaigns", icon: Megaphone, migrated: false },
  { key: "contacts", label: "Contacts", icon: Users, migrated: true },
  { key: "integrations", label: "Integrations", icon: Plug, migrated: false },
  { key: "billing", label: "Billing", icon: CreditCard, migrated: false },
  { key: "settings", label: "Settings", icon: Settings, migrated: true },
  { key: "catalog", label: "Catalog", icon: LayoutGrid, migrated: true },
];

function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U"
  );
}

export default function TenantLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const user = getStoredUser();
  const { data: workspace } = useWorkspace();

  useEffect(() => {
    if (!isAuthenticated()) window.location.href = "/";
  }, []);

  if (!isAuthenticated()) return null;

  const account = workspace?.account ?? "Workspace";
  const userName = workspace?.userPatch?.name ?? user?.name ?? "User";

  async function onLogout() {
    await logout().catch(() => {});
    window.location.href = "/";
  }

  return (
    <div className="store" style={{ minHeight: "100vh" }}>
      <header className="topbar">
        <div className="brandmark">
          <svg viewBox="0 0 32 32" fill="none" width={28} height={28} aria-hidden="true">
            <path d="M16 3 4 9l12 6 12-6-12-6Z" fill="#15784C" />
            <path d="M4 15l12 6 12-6" stroke="#0E5536" strokeWidth="2.4" strokeLinejoin="round" />
            <path d="M4 21l12 6 12-6" stroke="#1E8E5C" strokeWidth="2.4" strokeLinejoin="round" />
          </svg>
          <span
            style={{
              fontFamily: "var(--disp)",
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: "-.02em",
            }}
          >
            Shelf Merch
          </span>
        </div>
        <div className="acct">
          <div>
            <div className="k">Account</div>
            <div className="v">{account}</div>
          </div>
        </div>
        <div className="spacer" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={onLogout}>
          Sign out
        </button>
        <div className="avatar" title={userName} aria-label={userName}>
          {initialsOf(userName)}
        </div>
      </header>

      <div className="body">
        <nav className="sidebar scroll" aria-label="Workspace">
          {NAV.map(({ key, label, icon: Icon, migrated }) => {
            const active = pathname === `/app/${key}` || (key === "orders" && pathname === "/app");
            const className = `nav-item${active ? " on" : ""}`;
            return migrated ? (
              <Link key={key} to={`/app/${key}`} className={className}>
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ) : (
              <a key={key} href={`/?view=${key}`} className={className}>
                <Icon size={18} />
                <span>{label}</span>
              </a>
            );
          })}
        </nav>
        <main className="main scroll">
          <div className="wrap fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster position="bottom-center" richColors />
    </div>
  );
}
