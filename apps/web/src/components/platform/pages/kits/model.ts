import { fetchPlatformKits } from "@/services/platform-api";
import { useLoad } from "../../useLoad";

/** Platform kit list. */
export function usePlatformKitsList() {
  return useLoad(() => fetchPlatformKits(), []);
}
