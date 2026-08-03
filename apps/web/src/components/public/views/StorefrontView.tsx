import { LoadingState } from "@/components/LoadingState";
import StoreShell from "@/components/store/StoreShell";
import { normalizeCurrencyMode } from "@/lib/storeCurrency";
import { StoreAuthPanel } from "@/features/store-auth/StoreAuthPanel";
import type { StorefrontVm } from "../controllers/useStorefrontController";

/** Public storefront view: browse + gated cart/checkout behind shop-customer auth. */
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

  if (vm.authOpen) {
    return (
      <StoreAuthPanel
        shop={vm.data.shop}
        initialMode={vm.authMode}
        onAuthenticated={vm.onAuthenticated}
        onCancel={vm.onCloseAuth}
      />
    );
  }

  const authenticated = Boolean(vm.session);
  const creditInr = vm.session?.creditAmount ?? 0;

  return (
    <StoreShell
      shop={vm.data.shop}
      products={vm.data.products}
      mode="store"
      currency={normalizeCurrencyMode(vm.data.shop.currencyMode)}
      cartPersistId={vm.shopId}
      creditInr={authenticated ? creditInr : undefined}
      recipientName={vm.session?.customer.name}
      recipientEmail={vm.session?.customer.email}
      redemptionToken={vm.session?.redemptionToken || undefined}
      sessionToken={vm.sessionToken || undefined}
      authenticated={authenticated}
      onRequireAuth={() => vm.onOpenAuth("signin")}
      onCheckout={authenticated ? vm.onCheckout : undefined}
      onLogout={authenticated ? vm.onLogout : undefined}
      onFetchOrders={authenticated ? vm.onFetchOrders : undefined}
      onFetchTickets={authenticated ? vm.onFetchTickets : undefined}
      onRaiseTicket={authenticated ? vm.onRaiseTicket : undefined}
      onReplyTicket={authenticated ? vm.onReplyTicket : undefined}
      onConfirmTicket={authenticated ? vm.onConfirmTicket : undefined}
    />
  );
}
