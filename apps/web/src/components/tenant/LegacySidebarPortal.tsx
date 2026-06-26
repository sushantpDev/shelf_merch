import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CollapsibleSidebar } from "@/components/tenant/CollapsibleSidebar";

type ViewChangeDetail = {
  view: string;
  fullscreenFlow: boolean;
};

function readLegacyNavKey() {
  return window.__shelfMerchState?.nav ?? "orders";
}

function isLegacySidebarVisible() {
  const state = window.__shelfMerchState;
  if (!state?.authed) return false;
  const view = state.view ?? "";
  const fullscreenFlows = new Set([
    "createShop",
    "shopBuilder",
    "swagName",
    "swagCatalog",
    "swagArtwork",
    "sendPoints",
    "createKit",
    "editKit",
    "sendItems",
  ]);
  return !fullscreenFlows.has(view);
}

export function LegacySidebarPortal() {
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [activeKey, setActiveKey] = useState(readLegacyNavKey);
  const [visible, setVisible] = useState(isLegacySidebarVisible);

  const syncFromDom = useCallback(() => {
    setMount(document.getElementById("sidebar-root"));
    setActiveKey(readLegacyNavKey());
    setVisible(isLegacySidebarVisible());
  }, []);

  useEffect(() => {
    syncFromDom();

    const onViewChange = (event: Event) => {
      const detail = (event as CustomEvent<ViewChangeDetail>).detail;
      setActiveKey(readLegacyNavKey());
      setVisible(isLegacySidebarVisible() && !detail?.fullscreenFlow);
      setMount(document.getElementById("sidebar-root"));
    };

    window.addEventListener("sm:view-change", onViewChange);

    const app = document.getElementById("app");
    const observer =
      app &&
      new MutationObserver(() => {
        syncFromDom();
      });
    if (observer && app) {
      observer.observe(app, { childList: true, subtree: true });
    }

    return () => {
      window.removeEventListener("sm:view-change", onViewChange);
      observer?.disconnect();
    };
  }, [syncFromDom]);

  if (!mount || !visible) return null;

  return createPortal(<CollapsibleSidebar legacyActiveKey={activeKey} />, mount);
}
