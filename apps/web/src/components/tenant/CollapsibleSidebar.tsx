import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Gift,
  Home,
  LayoutGrid,
  Megaphone,
  Settings,
  Shirt,
  ShoppingBag,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { getStoredUser } from "@/services/api-bridge";
import { navItemsForTenantRole } from "@/services/tenant-access";
import { useWorkspace } from "@/hooks/useWorkspace";
import "./collapsible-sidebar.css";
import NavFooterImage from "../../../assets/nav_footer_img.png";

const STORAGE_KEY = "shelfmerch.sidebar.expanded";

const NAV_ICONS: Record<string, LucideIcon> = {
  home: Home,
  orders: ShoppingBag,
  wallets: Wallet,
  shops: Store,
  swag: Shirt,
  kits: Gift,
  campaigns: Megaphone,
  contacts: Users,
  settings: Settings,
  catalog: LayoutGrid,
};

type HoverFlyout = {
  label: string;
  top: number;
  left: number;
};

function readExpandedPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function SidebarNavLink({
  item,
  active,
  expanded,
  onItemHover,
  onItemLeave,
}: {
  item: { key: string; label: string; href: string };
  active: boolean;
  expanded: boolean;
  onItemHover: (label: string, el: HTMLElement) => void;
  onItemLeave: () => void;
}) {
  const Icon = NAV_ICONS[item.key] ?? Home;
  const className = `sidebar-rail__item${active ? " sidebar-rail__item--active" : ""}`;
  const icon = <Icon size={20} strokeWidth={1.75} aria-hidden="true" />;

  const content = (
    <>
      <span className="sidebar-rail__item-icon">{icon}</span>
      {expanded ? <span className="sidebar-rail__item-label">{item.label}</span> : null}
    </>
  );

  const a11y = expanded ? undefined : item.label;

  const hoverHandlers = expanded
    ? {}
    : {
        onMouseEnter: (event: MouseEvent<HTMLElement>) =>
          onItemHover(item.label, event.currentTarget),
        onMouseLeave: onItemLeave,
        onFocus: (event: FocusEvent<HTMLElement>) => onItemHover(item.label, event.currentTarget),
        onBlur: onItemLeave,
      };

  return (
    <Link to={item.href} className={className} aria-label={a11y} {...hoverHandlers}>
      {content}
    </Link>
  );
}

export function CollapsibleSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: workspace } = useWorkspace();
  const role = workspace?.userPatch?.role ?? getStoredUser()?.role;
  const navItems = navItemsForTenantRole(role);
  const railRef = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(readExpandedPreference);
  const [flyout, setFlyout] = useState<HoverFlyout | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(expanded));
    } catch {
      /* ignore quota / private mode */
    }
  }, [expanded]);

  useEffect(() => {
    if (expanded) setFlyout(null);
  }, [expanded]);

  const showFlyout = useCallback((label: string, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setFlyout({
      label,
      top: rect.top + rect.height / 2,
      left: rect.right + 8,
    });
  }, []);

  const hideFlyout = useCallback(() => setFlyout(null), []);

  return (
    <div className="sidebar-mount">
      <nav
        ref={railRef}
        className={`sidebar-rail scroll${expanded ? " sidebar-rail--expanded" : ""}`}
        aria-label="Workspace"
        onMouseLeave={hideFlyout}
      >
        <div className="sidebar-rail__nav">
          {navItems.map((item) => {
            const active = item.match
              ? item.match(pathname)
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <SidebarNavLink
                key={item.key}
                item={item}
                active={active}
                expanded={expanded}
                onItemHover={showFlyout}
                onItemLeave={hideFlyout}
              />
            );
          })}
        </div>

        <div className="sidebar-rail__footer" style={{ marginTop: 0, paddingTop: 0 }}>
          <img src={NavFooterImage} alt="Nav Footer" />
        </div>
      </nav>

      <button
        type="button"
        className="sidebar-rail__toggle"
        aria-label="Toggle sidebar"
        aria-expanded={expanded}
        onClick={() => setExpanded((prev) => !prev)}
      >
        {expanded ? (
          <ChevronLeft size={13} strokeWidth={2.2} aria-hidden="true" />
        ) : (
          <ChevronRight size={13} strokeWidth={2.2} aria-hidden="true" />
        )}
      </button>

      {!expanded &&
        flyout &&
        createPortal(
          <span className="sidebar-rail__flyout" style={{ top: flyout.top, left: flyout.left }}>
            {flyout.label}
          </span>,
          document.body,
        )}
    </div>
  );
}
