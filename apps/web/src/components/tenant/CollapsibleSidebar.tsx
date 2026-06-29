import {
  useCallback,
  useEffect,
  useLayoutEffect,
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
  CreditCard,
  Gift,
  Home,
  LayoutGrid,
  Megaphone,
  Plug,
  Settings,
  Shirt,
  ShoppingBag,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import "./collapsible-sidebar.css";

const STORAGE_KEY = "shelfmerch.sidebar.expanded";

type SidebarNavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;
  internal?: boolean;
  match?: (pathname: string) => boolean;
};

type HoverFlyout = {
  label: string;
  top: number;
  left: number;
};

const NAV_ITEMS: SidebarNavItem[] = [
  {
    key: "home",
    label: "Home",
    icon: Home,
    href: "/app/orders",
    internal: true,
    match: (pathname) => pathname === "/app" || pathname === "/app/",
  },
  {
    key: "orders",
    label: "Orders",
    icon: ShoppingBag,
    href: "/app/orders",
    internal: true,
    match: (pathname) => pathname === "/app/orders",
  },
  {
    key: "wallets",
    label: "Wallets",
    icon: Wallet,
    href: "/app/wallets",
    internal: true,
  },
  { key: "shops", label: "Shops", icon: Store, href: "/app/shops", internal: true },
  { key: "swag", label: "Swag", icon: Shirt, href: "/app/swag", internal: true },
  { key: "kits", label: "Kits", icon: Gift, href: "/app/kits", internal: true },
  {
    key: "campaigns",
    label: "Campaigns",
    icon: Megaphone,
    href: "/app/campaigns",
    internal: true,
  },
  {
    key: "contacts",
    label: "Contacts",
    icon: Users,
    href: "/app/contacts",
    internal: true,
  },
  {
    key: "integrations",
    label: "Integrations",
    icon: Plug,
    href: "/app/integrations",
    internal: true,
  },
  {
    key: "settings",
    label: "Settings",
    icon: Settings,
    href: "/app/settings",
    internal: true,
  },
  { key: "billing", label: "Billing", icon: CreditCard, href: "/app/billing", internal: true },
  {
    key: "catalog",
    label: "Catalog",
    icon: LayoutGrid,
    href: "/app/catalog",
    internal: true,
  },
];

function readExpandedPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function isItemActive(item: SidebarNavItem, pathname: string, legacyActiveKey?: string): boolean {
  if (legacyActiveKey !== undefined) {
    if (item.internal || item.key === "home") return false;
    return item.key === legacyActiveKey;
  }
  if (item.match) return item.match(pathname);
  if (item.internal) return pathname === item.href;
  return false;
}

function SidebarNavLink({
  item,
  active,
  expanded,
  legacyMode,
  onItemHover,
  onItemLeave,
}: {
  item: SidebarNavItem;
  active: boolean;
  expanded: boolean;
  legacyMode: boolean;
  onItemHover: (label: string, el: HTMLElement) => void;
  onItemLeave: () => void;
}) {
  const className = `sidebar-rail__item${active ? " sidebar-rail__item--active" : ""}`;
  const icon = <item.icon size={20} strokeWidth={1.75} aria-hidden="true" />;

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

  const linkProps = {
    className,
    "aria-label": a11y,
    ...hoverHandlers,
  };

  if (legacyMode && !item.internal) {
    return (
      <button type="button" {...linkProps} onClick={() => window.__shelfMerchNavigate?.(item.key)}>
        {content}
      </button>
    );
  }

  if (item.internal) {
    return (
      <Link to={item.href} {...linkProps}>
        {content}
      </Link>
    );
  }

  return (
    <a href={item.href} {...linkProps}>
      {content}
    </a>
  );
}

export type CollapsibleSidebarProps = {
  /** When set, sidebar is hosted inside the legacy shelf-merch shell. */
  legacyActiveKey?: string;
};

export function CollapsibleSidebar({ legacyActiveKey }: CollapsibleSidebarProps = {}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const railRef = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(readExpandedPreference);
  const [flyout, setFlyout] = useState<HoverFlyout | null>(null);
  const [togglePos, setTogglePos] = useState<{ top: number; left: number } | null>(null);
  const legacyMode = legacyActiveKey !== undefined;

  const syncTogglePosition = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const rect = rail.getBoundingClientRect();
    const topbar = document.querySelector<HTMLElement>(".tenant-shell .topbar, #app .topbar");
    const topbarBottom = topbar?.getBoundingClientRect().bottom;
    setTogglePos({
      top: topbarBottom ?? rect.top,
      left: rect.right - 1,
    });
  }, []);

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

  useLayoutEffect(() => {
    syncTogglePosition();

    const rail = railRef.current;
    const observer = rail ? new ResizeObserver(syncTogglePosition) : null;
    if (rail && observer) observer.observe(rail);

    window.addEventListener("resize", syncTogglePosition);
    window.addEventListener("scroll", syncTogglePosition, true);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", syncTogglePosition);
      window.removeEventListener("scroll", syncTogglePosition, true);
    };
  }, [expanded, syncTogglePosition]);

  const showFlyout = (label: string, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setFlyout({
      label,
      top: rect.top + rect.height / 2,
      left: rect.right + 8,
    });
  };

  const hideFlyout = () => setFlyout(null);

  const toggleButton =
    togglePos &&
    createPortal(
      <button
        type="button"
        className="sidebar-rail__toggle"
        style={{ top: togglePos.top, left: togglePos.left }}
        aria-label="Toggle sidebar"
        aria-expanded={expanded}
        onClick={() => setExpanded((prev) => !prev)}
      >
        {expanded ? (
          <ChevronLeft size={13} strokeWidth={2.2} aria-hidden="true" />
        ) : (
          <ChevronRight size={13} strokeWidth={2.2} aria-hidden="true" />
        )}
      </button>,
      document.body,
    );

  return (
    <>
      <nav
        ref={railRef}
        className={`sidebar-rail scroll${expanded ? " sidebar-rail--expanded" : ""}`}
        aria-label="Workspace"
        onMouseLeave={hideFlyout}
      >
        <div className="sidebar-rail__nav">
          {NAV_ITEMS.map((item) => (
            <SidebarNavLink
              key={item.key}
              item={item}
              active={isItemActive(item, pathname, legacyActiveKey)}
              expanded={expanded}
              legacyMode={legacyMode}
              onItemHover={showFlyout}
              onItemLeave={hideFlyout}
            />
          ))}
        </div>
      </nav>

      {toggleButton}

      {!expanded &&
        flyout &&
        createPortal(
          <span className="sidebar-rail__flyout" style={{ top: flyout.top, left: flyout.left }}>
            {flyout.label}
          </span>,
          document.body,
        )}
    </>
  );
}
