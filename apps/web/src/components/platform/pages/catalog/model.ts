import { fetchPlatformProducts } from "@/services/platform-api";
import { useLoad } from "../../useLoad";

/** Platform product catalog list. */
export function usePlatformProducts() {
  return useLoad(() => fetchPlatformProducts({ limit: 100 }), []);
}
