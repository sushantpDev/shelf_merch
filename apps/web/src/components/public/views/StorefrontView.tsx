import { LoadingState } from "@/components/LoadingState";
import StoreShell from "@/components/store/StoreShell";
import type { StorefrontVm } from "../controllers/useStorefrontController";

/** Public storefront view: loading/error states, then the store shell in preview mode. */
export function StorefrontView(vm: StorefrontVm) {
  if (vm.state === "loading") {
    return <LoadingState message="Loading shop…" />;
  }

  if (vm.state === "error" || !vm.data) {
    return (
      <div className="auth">
        <div className="auth-form">
          <div className="inner">
            <h1>Shop unavailable</h1>
            <p className="muted">{vm.error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StoreShell
      shop={vm.data.shop}
      products={vm.data.products}
      mode="preview"
      currency={(vm.data.shop.currencyMode as "points" | "inr" | "priceless") || "points"}
    />
  );
}
