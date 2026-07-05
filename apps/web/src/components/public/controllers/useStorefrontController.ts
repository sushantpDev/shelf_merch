import { useEffect, useState } from "react";
import { getPublicStorefront, type StorefrontData } from "@/services/api-bridge";

export type StorefrontState = "loading" | "ready" | "error";

export type StorefrontVm = {
  state: StorefrontState;
  data: StorefrontData | null;
  error: string;
};

/** Controller for the public storefront: fetch the shop by id. */
export function useStorefrontController(shopId: string): StorefrontVm {
  const [state, setState] = useState<StorefrontState>("loading");
  const [data, setData] = useState<StorefrontData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getPublicStorefront(shopId);
        if (!active) return;
        setData(res);
        setState("ready");
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "This shop is unavailable");
        setState("error");
      }
    })();
    return () => {
      active = false;
    };
  }, [shopId]);

  return { state, data, error };
}
