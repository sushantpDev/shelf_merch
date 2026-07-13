import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router";
import {
  getStoredUser,
  isAuthenticated,
  isPlatformUser,
  logout,
} from "@/services/api-bridge";
import { navItemsForRole } from "@/services/platform-access";
import { ShelfMerchLogo } from "@/components/brand/ShelfMerchLogo";

export default function PlatformLayout() {
  const user = getStoredUser();
  const pathname = useLocation().pathname;
  const navItems = navItemsForRole(user?.role);

  useEffect(() => {
    if (!isAuthenticated() || !isPlatformUser(user)) {
      window.location.href = "/";
    }
  }, [user?.id, user?.role, user?.scopeType]);

  async function onLogout() {
    await logout().catch(() => {});
  }

  if (!user || !isPlatformUser(user)) return null;

  let lastSection = "";

  return (
    <div id="app" style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="topbar">
        <div className="brandmark">
          <ShelfMerchLogo height={32} />
          <div>
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
