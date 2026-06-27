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

/** Legacy hand-off deep-links for kit flows not yet migrated to React. */
export const kitLaunch = {
  create: () => {
    window.location.href = "/?view=kitsLaunch&launch=createKit";
  },
  use: (templateId: string) => {
    window.location.href = `/?view=kitsLaunch&launch=useKit&kit=${encodeURIComponent(templateId)}`;
  },
  edit: (kitId: string) => {
    window.location.href = `/?view=kitsLaunch&launch=editKit&kit=${encodeURIComponent(kitId)}`;
  },
  send: (kitId: string) => {
    window.location.href = `/?view=kitsLaunch&launch=sendKit&kit=${encodeURIComponent(kitId)}`;
  },
};
