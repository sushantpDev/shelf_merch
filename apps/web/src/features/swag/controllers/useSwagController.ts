import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import { mergeCatalogProductDetails } from "@/services/mappers";
import type { UiCollection, UiShop } from "../model";

export type SwagTab = "Collections" | "Archived";

export type SwagVm = {
  isLoading: boolean;
  errorMessage: string | null;
  canDesignSwag: boolean;
  canManageSwag: boolean;
  canPublish: boolean;
  tab: SwagTab;
  collections: UiCollection[];
  shops: UiShop[];
  shopNameById: Map<string, string>;
  empty: boolean;
  viewCollection: UiCollection | null;
  publishCollection: UiCollection | null;
  onSelectTab: (tab: SwagTab) => void;
  onStartDesigning: () => void;
  onViewCollection: (col: UiCollection | null) => void;
  onPublishCollection: (col: UiCollection | null) => void;
};

/** Controller for the Swag collection management module. */
export function useSwagController(): SwagVm {
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const { canWrite } = useTenantAccess();
  const navigate = useNavigate();
  const [tab, setTab] = useState<SwagTab>("Collections");
  const [viewCollection, setViewCollection] = useState<UiCollection | null>(null);
  const [publishCollection, setPublishCollection] = useState<UiCollection | null>(null);

  const catalogProducts = workspace?.catalogProducts ?? [];
  const shops = workspace?.shops ?? [];

  const shopNameById = useMemo(
    () => new Map(shops.map((s) => [s.id, s.name])),
    [shops],
  );

  const allCollections = useMemo(() => {
    return (workspace?.collections ?? []).map((col) => ({
      ...col,
      products: col.products.map((p) => mergeCatalogProductDetails(p, catalogProducts)),
    }));
  }, [workspace?.collections, catalogProducts]);

  const collections = useMemo(
    () =>
      tab === "Archived"
        ? allCollections.filter((c) => c.status === "archived")
        : allCollections.filter((c) => c.status !== "archived"),
    [allCollections, tab],
  );

  return {
    isLoading: isLoading && !workspace,
    errorMessage:
      isError || !workspace
        ? error instanceof Error
          ? error.message
          : "Could not load swag"
        : null,
    canDesignSwag: canWrite("swag"),
    canManageSwag: canWrite("swag"),
    canPublish: canWrite("shops"),
    tab,
    collections,
    shops,
    shopNameById,
    empty: collections.length === 0,
    viewCollection,
    publishCollection,
    onSelectTab: setTab,
    onStartDesigning: () => navigate("/app/swag/new"),
    onViewCollection: setViewCollection,
    onPublishCollection: setPublishCollection,
  };
}
