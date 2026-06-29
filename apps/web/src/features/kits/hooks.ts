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
