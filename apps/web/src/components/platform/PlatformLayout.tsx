import { useEffect } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  getStoredUser,
  isAuthenticated,
  isPlatformUser,
  logout,
} from "@/services/api-bridge";
import { navItemsForRole } from "@/services/platform-access";
import "@/styles/shelf-merch.css";

const LOGO = `<svg viewBox="0 0 32 32" fill="none"><path d="M16 3 4 9l12 6 12-6-12-6Z" fill="#15784C"/><path d="M4 15l12 6 12-6" stroke="#0E5536" stroke-width="2.4" stroke-linejoin="round"/><path d="M4 21l12 6 12-6" stroke="#1E8E5C" stroke-width="2.4" stroke-linejoin="round"/></svg>`;

export default function PlatformLayout() {
  const user = getStoredUser();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navItems = navItemsForRole(user?.role);

  useEffect(() => {
    if (!isAuthenticated() || !isPlatformUser(user)) {
      window.location.href = "/";
    }
  }, [user?.id, user?.role, user?.scopeType]);

  async function onLogout() {
    await logout().catch(() => {});
    window.location.href = "/";
  }

  if (!user || !isPlatformUser(user)) return null;

  let lastSection = "";

  return (
    <div id="app" style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="topbar">
        <div className="brandmark">
          <span dangerouslySetInnerHTML={{ __html: LOGO }} />
          <div>
            <div className="k" style={{ fontSize: 10, letterSpacing: ".12em", color: "var(--ink-3)" }}>
              SHELF MERCH
            </div>
            <div className="v" style={{ fontFamily: "var(--disp)", fontWeight: 700, fontSize: 16 }}>
              Control Plane
            </div>
          </div>
        </div>
        <div className="spacer" />
        <div className="acct">
          <div>
            <div className="k">Signed in</div>
            <div className="v" style={{ fontSize: 14 }}>
              {user.name}
            </div>
          </div>
          <div className="avatar">{user.name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")}</div>
        </div>
        <Link to="/" className="btn btn-ghost btn-sm">
          Tenant app
        </Link>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onLogout}>
          Sign out
        </button>
      </header>

      <div className="body">
        <aside className="sidebar scroll">
          {navItems.map((item) => {
            const showSection = item.section && item.section !== lastSection;
            if (item.section) lastSection = item.section;
            const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <div key={item.path}>
                {showSection ? <div className="nav-sec">{item.section}</div> : null}
                <Link to={item.path} className={`nav-item${active ? " on" : ""}`}>
                  {item.label}
                </Link>
              </div>
            );
          })}
        </aside>

        <main className="main scroll">
          <div className="wrap">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
