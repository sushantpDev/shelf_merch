import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { getStoredUser } from "@/services/auth-store";
import { canAccessArea } from "@/services/platform-access";
import { PAGE_SIZES, type TenantRow, usePlatformTenants } from "../model";

export type TenantsVm = ReturnType<typeof useTenantsController>;

function parsePositiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/** Controller for the platform tenants directory — URL-backed filters + pagination. */
export function useTenantsController() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reloadKey, setReloadKey] = useState(0);
  const [managing, setManaging] = useState<TenantRow | null>(null);
  const [searchDraft, setSearchDraft] = useState(() => searchParams.get("search") ?? "");

  const params = useMemo(() => {
    const limitRaw = parsePositiveInt(searchParams.get("limit"), 20);
    const limit = (PAGE_SIZES as readonly number[]).includes(limitRaw) ? limitRaw : 20;
    return {
      status: searchParams.get("status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      page: parsePositiveInt(searchParams.get("page"), 1),
      limit,
      sort: (searchParams.get("sort") as "name" | "createdAt" | "lastActiveAt" | null) ?? "createdAt",
      order: (searchParams.get("order") as "asc" | "desc" | null) ?? "desc",
    };
  }, [searchParams]);

  const load = usePlatformTenants(params, reloadKey);
  const canWrite = canAccessArea(getStoredUser()?.role, "tenants", "write");

  const patchParams = useCallback(
    (patch: Record<string, string | null>, resetPage = true) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value === null || value === "") next.delete(key);
          else next.set(key, value);
        }
        if (resetPage && !("page" in patch)) next.delete("page");
        return next;
      });
    },
    [setSearchParams],
  );

  return {
    ...load,
    params,
    searchDraft,
    canWrite,
    managing,
    onSearchDraft: setSearchDraft,
    onSearchSubmit: () => patchParams({ search: searchDraft.trim() || null }),
    onStatusFilter: (status: string) => patchParams({ status: status || null }),
    onSort: (sort: string) => patchParams({ sort }),
    onOrder: (order: string) => patchParams({ order }),
    onPage: (page: number) => patchParams({ page: String(page) }, false),
    onLimit: (limit: number) => patchParams({ limit: String(limit), page: null }),
    onClearFilters: () => {
      setSearchDraft("");
      setSearchParams(new URLSearchParams());
    },
    onManage: setManaging,
    onCloseManage: () => setManaging(null),
    onTenantsChanged: () => setReloadKey((k) => k + 1),
    onRetry: () => setReloadKey((k) => k + 1),
    hasActiveFilters: Boolean(params.status || params.search),
  };
}
