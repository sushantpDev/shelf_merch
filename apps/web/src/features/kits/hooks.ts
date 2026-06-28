import { useQuery } from "@tanstack/react-query";
import { refreshPlatformKits, type PlatformKitTemplate } from "@/services/api-bridge";

export const PLATFORM_KITS_QUERY_KEY = ["platform-kits"] as const;

/** Platform-curated kit templates shown in the "Pre-designed kits" section. */
export function usePlatformKits() {
  return useQuery<PlatformKitTemplate[]>({
    queryKey: PLATFORM_KITS_QUERY_KEY,
    queryFn: refreshPlatformKits,
    staleTime: 60_000,
  });
}

/**
 * Send-kit checkout still hands off to the legacy engine (not yet migrated).
 * Create / edit / use-template are native React routes — navigate to
 * `/app/kits/new`, `/app/kits/$id/edit`, or `/app/kits/new?template=…`.
 */
export const kitLaunch = {
  send: (kitId: string) => {
    window.location.href = `/?view=kitsLaunch&launch=sendKit&kit=${encodeURIComponent(kitId)}`;
  },
};
