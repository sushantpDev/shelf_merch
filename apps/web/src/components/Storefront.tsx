import { useEffect, useState } from "react";
import { getPublicStorefront, type StorefrontData } from "@/services/api-bridge";
import StoreShell from "./store/StoreShell";
import "@/styles/shelf-merch.css";

type State = "loading" | "ready" | "error";

export default function Storefront({ shopId }: { shopId: string }) {
  const [state, setState] = useState<State>("loading");
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

  if (state === "loading") {
    return (
      <div className="auth">
        <div style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>Loading shop…</div>
      </div>
    );
  }

  if (state === "error" || !data) {
    return (
      <div className="auth">
        <div className="auth-form">
          <div className="inner">
            <h1>Shop unavailable</h1>
            <p className="muted">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StoreShell
      shop={data.shop}
      products={data.products}
      mode="preview"
      currency={(data.shop.currencyMode as "points" | "inr" | "priceless") || "points"}
    />
  );
}
